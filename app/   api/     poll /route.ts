import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    success: true,
    message: "Polling endpoint başarıyla oluşturuldu",
    timestamp: new Date().toISOString(),
    note: "Bu endpoint çalışıyor. Gerçek polling mantığı buraya eklenecek."
  });
}
