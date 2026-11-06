import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
export const runtime = "nodejs";
export async function GET(){let database="not-configured";if(prisma){try{await prisma.$queryRaw`SELECT 1`;database="connected";}catch{database="error";}}return NextResponse.json({ok:database==="connected",application:"victor-scientific-next",database, timestamp:new Date().toISOString()},{status:database==="error"?503:200});}
