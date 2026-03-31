import { NextResponse } from 'next/server';

export async function GET() {
  const testOrder = {
    order_id: "TEST-" + Date.now(),
    email: "test@example.com",
    service_name: "Instagram Beğeni Test",
    quantity: 500,
    link: "https://www.instagram.com/p/TEST123456/"
  };

  const baseUrl = "https://smm-panelim-4yesoo5u3-alldigitalgames-projects.vercel.app";

  try {
    const response = await fetch(`${baseUrl}/api/webhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testOrder),
    });

    const result = await response.json();

    return NextResponse.json({
      success: true,
      message: "✅ Test siparişi webhook'a gönderildi",
      test_order_id: testOrder.order_id,
      webhook_response: result,
      note: "Telegram bildirimi kontrol et!"
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || "Bilinmeyen hata"
    }, { status: 500 });
  }
}
