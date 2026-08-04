import { NextResponse } from "next/server";
import { getGoBizStatus } from "@/lib/gobiz";

export async function GET() {
  return NextResponse.json(await getGoBizStatus());
}
