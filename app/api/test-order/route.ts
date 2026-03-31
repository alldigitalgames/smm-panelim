import { NextResponse } from 'next/server';

export async function GET() {
  const testOrder = {
    order_id: "TEST-" + Date.now(),
    email: "test@example.com",
    service_name: "Instagram Beğeni Test",
    quantity: 500,
    link: "https://www.instagram.com/p/TEST123456/"
  };

  try {
    const response = await fetch('https://smm-panelim-4yesoo5u3-alldigitalgames-projects.vercel.app/api/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testOrder),
    });

    const result = await response.json();

    return NextResponse.json({
      success: true,
      message: "Test siparişi gönderildi",
      test_order_id: testOrder.order_id,
      webhook_response: result
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      note: "Webhook endpoint'ine ulaşılamadı"
    }, { status: 500 });
  }
}
