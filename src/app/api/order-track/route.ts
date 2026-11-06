import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import mariadb from "mariadb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const requestSchema = z.object({
  invoiceId: z.string().trim().min(5).max(55),
  phone: z.string().trim().regex(/^[0-9+\-\s()]{7,25}$/),
});

type TrackRow = {
  invoice_id: string;
  amount: number | string;
  discount: number | string;
  shipping_charge: number | string;
  payment_status: string | null;
  created_at: Date | string | null;
  status_name: string | null;
  phone: string;
};

const attempts = new Map<string, { count: number; resetAt: number }>();

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

function normalizePhone(value: string) {
  return value.replace(/\D/g, "");
}

function sameOrigin(request: NextRequest) {
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

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const now = Date.now();
  const current = attempts.get(ip);

  if (current && current.resetAt > now && current.count >= 10) {
    return NextResponse.json(
      { error: "Too many tracking attempts. Please try again later." },
      { status: 429 }
    );
  }

  if (!current || current.resetAt <= now) {
    attempts.set(ip, { count: 1, resetAt: now + 5 * 60 * 1000 });
  } else {
    attempts.set(ip, { count: current.count + 1, resetAt: current.resetAt });
  }

  const parsed = requestSchema.safeParse(
    await request.json().catch(() => null)
  );

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Enter a valid invoice number and phone number." },
      { status: 400 }
    );
  }

  let connection:
    | Awaited<ReturnType<typeof mariadb.createConnection>>
    | null = null;

  try {
    connection = await mariadb.createConnection(databaseOptions());

    const rows = await connection.query(
      `SELECT
         o.invoice_id,
         o.amount,
         o.discount,
         o.shipping_charge,
         o.payment_status,
         o.created_at,
         os.name AS status_name,
         s.phone
       FROM orders o
       INNER JOIN shippings s ON s.order_id=o.id
       LEFT JOIN order_statuses os ON os.id=o.order_status
       WHERE o.invoice_id=?
       LIMIT 1`,
      [parsed.data.invoiceId]
    ) as TrackRow[];

    const order = rows[0];

    if (
      !order ||
      normalizePhone(order.phone) !== normalizePhone(parsed.data.phone)
    ) {
      return NextResponse.json(
        { error: "No matching order was found. Check the invoice number and phone number." },
        { status: 404 }
      );
    }

    const amount = Number(order.amount);
    const discount = Number(order.discount);
    const shippingCharge = Number(order.shipping_charge);

    return NextResponse.json({
      ok: true,
      order: {
        invoiceId: order.invoice_id,
        status: order.status_name || "Processing status unavailable",
        paymentStatus: order.payment_status || "Unknown",
        subtotal: amount,
        discount,
        shippingCharge,
        total: amount - discount + shippingCharge,
        createdAt: order.created_at,
      },
    });
  } catch (error) {
    console.error("[order-track]", error);
    return NextResponse.json(
      { error: "Order tracking is temporarily unavailable." },
      { status: 503 }
    );
  } finally {
    if (connection) await connection.end();
  }
}
