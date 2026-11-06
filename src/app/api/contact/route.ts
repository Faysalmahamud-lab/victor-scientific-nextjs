import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
export const runtime = "nodejs";
const schema=z.object({fullName:z.string().min(2).max(120),mobile:z.string().min(7).max(20),email:z.union([z.string().email(),z.literal("")]).optional(),subject:z.string().max(160).optional(),details:z.string().min(10).max(4000)});
export async function POST(request:NextRequest){const parsed=schema.safeParse(await request.json().catch(()=>null));if(!parsed.success)return NextResponse.json({error:"Please check the submitted fields."},{status:400});if(!prisma)return NextResponse.json({error:"The contact database has not been configured yet."},{status:503});try{await prisma.contactMessage.create({data:{fullName:parsed.data.fullName,mobile:parsed.data.mobile,email:parsed.data.email||null,subject:parsed.data.subject||null,details:parsed.data.details,status:false}});return NextResponse.json({ok:true});}catch{return NextResponse.json({error:"The message could not be saved. Please try again later."},{status:503});}}
