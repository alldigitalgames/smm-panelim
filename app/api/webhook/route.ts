import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  // ItemSatış’ın kendi botu zaten bildirim gönderdiği için sadece OK dönüyoruz
  return NextResponse.json({ success: true });
}

export async function GET() {
  return NextResponse.json({ status: "ok", message: "Webhook pasif - ItemSatış kendi botu kullanılıyor" });
}
