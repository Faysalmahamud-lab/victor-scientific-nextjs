import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import mariadb from "mariadb";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const checkoutSchema = z.object({
  name: z.string().trim().min(2).max(155),
  phone: z.string().trim().regex(/^[0-9+\-\s()]{7,25}$/),
  email: z.union([z.string().trim().email().max(55), z.literal("")]).optional(),
  district: z.string().trim().min(2).max(100),
  area: z.string().trim().min(2).max(256),
  address: z.string().trim().min(5).max(256),
  deliveryZone: z.enum(["dhaka", "outside-dhaka"]),
  note: z.string().trim().max(1000).optional(),
  items: z.array(
    z.object({
      productId: z.string().regex(/^[0-9]+$/),
      quantity: z.number().int().min(1).max(20),
    })
  ).min(1).max(30),
});

type ProductRow = {
  id: string | number | bigint;
  name: string;
  new_price: number | string;
  stock: number | string;
};

function databaseOptions() {
  const raw = process.env.DATABASE_URL;
  if (!raw) throw new Error("Database is not configured.");

  const url = new URL(raw);

  return {
    host: url.hostname,
    port: Number(url.port || 3306),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: decodeURIComponent(url.pathname.slice(1)),
    connectTimeout: 5000,
  };
}

function requestIsSameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) return false;

  try {
    const host =
      request.headers.get("x-forwarded-host")?.split(",")[0].trim() ||
      request.headers.get("host");
    return Boolean(host && new URL(origin).host === host);
  } catch {
    return false;
  }
}

function normalizePhone(value: string) {
  return value.replace(/[^0-9+]/g, "").slice(0, 25);
}

function makeSlug(value: string) {
  const base = value
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120)
    .toLowerCase();

  return `${base || "guest"}-${randomBytes(4).toString("hex")}`;
}

export async function POST(request: NextRequest) {
  if (!requestIsSameOrigin(request)) {
    return NextResponse.json(
      { error: "Invalid request origin." },
      { status: 403 }
    );
  }

  if (process.env.CHECKOUT_ENABLED !== "true") {
    return NextResponse.json(
      {
        error:
          "Guest checkout is not enabled yet. Complete staging order-workflow verification before enabling it.",
      },
      { status: 503 }
    );
  }

  const parsed = checkoutSchema.safeParse(
    await request.json().catch(() => null)
  );

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please review the delivery and contact details." },
      { status: 400 }
    );
  }

  const input = parsed.data;
  const normalizedPhone = normalizePhone(input.phone);
  const uniqueItems = new Map<string, number>();

  for (const item of input.items) {
    uniqueItems.set(
      item.productId,
      (uniqueItems.get(item.productId) || 0) + item.quantity
    );
  }

  if ([...uniqueItems.values()].some((quantity) => quantity > 20)) {
    return NextResponse.json(
      { error: "A product quantity cannot exceed 20." },
      { status: 400 }
    );
  }

  let connection:
    | Awaited<ReturnType<typeof mariadb.createConnection>>
    | null = null;

  try {
    connection = await mariadb.createConnection(databaseOptions());
    await connection.beginTransaction();

    const productIds = [...uniqueItems.keys()];
    const placeholders = productIds.map(() => "?").join(",");

    const productRows = await connection.query(
      `SELECT id,name,new_price,stock
       FROM products
       WHERE id IN (${placeholders})
         AND status=1
         AND approval_status='approved'
       FOR UPDATE`,
      productIds
    ) as ProductRow[];

    const products = new Map(
      productRows.map((product) => [String(product.id), product])
    );

    if (products.size !== productIds.length) {
      await connection.rollback();
      return NextResponse.json(
        { error: "One or more selected products are no longer available." },
        { status: 409 }
      );
    }

    let subtotal = 0;
    const orderLines: Array<{
      id: string;
      name: string;
      price: number;
      quantity: number;
    }> = [];

    for (const [productId, quantity] of uniqueItems) {
      const product = products.get(productId);
      if (!product) continue;

      const price = Number(product.new_price);
      const stock = Number(product.stock);

      if (!Number.isSafeInteger(price) || price <= 0) {
        await connection.rollback();
        return NextResponse.json(
          { error: `The price for ${product.name} needs confirmation.` },
          { status: 409 }
        );
      }

      if (!Number.isSafeInteger(stock) || stock < quantity) {
        await connection.rollback();
        return NextResponse.json(
          { error: `Insufficient stock for ${product.name}.` },
          { status: 409 }
        );
      }

      subtotal += price * quantity;
      orderLines.push({
        id: productId,
        name: product.name,
        price,
        quantity,
      });
    }

    if (!Number.isSafeInteger(subtotal) || subtotal <= 0) {
      await connection.rollback();
      return NextResponse.json(
        { error: "Unable to calculate the order total." },
        { status: 400 }
      );
    }

    const shippingCharge =
      input.deliveryZone === "dhaka" ? 80 : 150;
    const payable = subtotal + shippingCharge;

    const statusRows = await connection.query(
      `SELECT id
       FROM order_statuses
       WHERE LOWER(slug) IN ('pending','new','pending-order')
          OR LOWER(name) IN ('pending','new')
       ORDER BY
         CASE
           WHEN LOWER(slug)='pending' THEN 0
           WHEN LOWER(name)='pending' THEN 1
           ELSE 2
         END,
         id ASC
       LIMIT 1`
    ) as Array<{ id: number | string }>;

    const pendingStatus = statusRows[0];

    if (!pendingStatus) {
      await connection.rollback();
      return NextResponse.json(
        {
          error:
            "The staging database does not contain a recognised pending order status. Configure and verify the legacy order status before accepting orders.",
        },
        { status: 503 }
      );
    }

    const customerRows = await connection.query(
      `SELECT id
       FROM customers
       WHERE phone=?
       LIMIT 1
       FOR UPDATE`,
      [normalizedPhone]
    ) as Array<{ id: number | string }>;

    let customerId: string;

    if (customerRows[0]) {
      customerId = String(customerRows[0].id);
    } else {
      const guestPassword = await bcrypt.hash(
        randomBytes(32).toString("hex"),
        12
      );

      const customerResult = await connection.query(
        `INSERT INTO customers
         (name,slug,phone,email,district,address,password,status,created_at,updated_at)
         VALUES (?,?,?,?,?,?,?,'active',NOW(),NOW())`,
        [
          input.name,
          makeSlug(input.name),
          normalizedPhone,
          input.email || null,
          input.district,
          input.address,
          guestPassword,
        ]
      ) as { insertId: number | bigint };

      customerId = String(customerResult.insertId);
    }

    const invoiceId = `VSC-${Date.now()}-${randomBytes(3).toString("hex").toUpperCase()}`;
    const forwardedFor = request.headers.get("x-forwarded-for");
    const ipAddress = forwardedFor?.split(",")[0]?.trim() || null;
    const orderNote = [
      input.note || "",
      "For oversized or heavy products, the team will contact the customer and confirm any additional delivery cost before processing. No automatic surcharge is applied.",
    ].filter(Boolean).join("\n");

    const orderResult = await connection.query(
      `INSERT INTO orders
       (invoice_id,amount,discount,shipping_charge,customer_id,ip_address,
        order_status,payment_status,payment_gateway,customer_payable_amount,
        advance_amount,order_note,created_at,updated_at)
       VALUES (?,?,0,?,?,?,?, 'unpaid','cod',?,0,?,NOW(),NOW())`,
      [
        invoiceId,
        subtotal,
        shippingCharge,
        Number(customerId),
        ipAddress,
        Number(pendingStatus.id),
        payable,
        orderNote,
      ]
    ) as { insertId: number | bigint };

    const orderId = Number(orderResult.insertId);

    for (const line of orderLines) {
      await connection.query(
        `INSERT INTO order_details
         (order_id,product_id,product_name,sale_price,product_discount,qty,created_at,updated_at)
         VALUES (?,?,?, ?,0,?,NOW(),NOW())`,
        [
          orderId,
          Number(line.id),
          line.name.slice(0, 255),
          line.price,
          line.quantity,
        ]
      );
    }

    await connection.query(
      `INSERT INTO shippings
       (order_id,customer_id,name,phone,address,area,created_at,updated_at)
       VALUES (?,?,?,?,?,?,NOW(),NOW())`,
      [
        orderId,
        Number(customerId),
        input.name,
        normalizedPhone,
        input.address,
        `${input.area}, ${input.district}`,
      ]
    );

    await connection.commit();

    return NextResponse.json(
      {
        ok: true,
        invoiceId,
        subtotal,
        shippingCharge,
        total: payable,
      },
      { status: 201 }
    );
  } catch (error) {
    if (connection) await connection.rollback();

    console.error("[guest-checkout]", error);

    return NextResponse.json(
      { error: "The order could not be placed. Please contact the team." },
      { status: 503 }
    );
  } finally {
    if (connection) await connection.end();
  }
}
