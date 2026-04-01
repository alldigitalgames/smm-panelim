import { NextResponse } from 'next/server';

export async function GET() {
  const testOrder = {
    order_id: "TEST-" + Date.now(),
    email: "test@alldigitalgames.com",
    service_name: "Instagram Beğeni Test",
    quantity: 2500,
    link: "https://www.instagram.com/testkullanici123/",
    sales_price: 12.50
  };

  try {
    const webhookUrl = "https://smm-panelim-oz610tzuj-alldigitalgames-projects.vercel.app/api/webhook";

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testOrder),
    });

    const result = await response.json();

    return NextResponse.json({
      success: true,
      message: "Test siparişi webhook'a gönderildi",
      test_order_id: testOrder.order_id,
      webhook_response: result,
      note: "Telegram bildirimi kontrol et!"
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      note: "Webhook'a bağlanılamadı"
    }, { status: 500 });
  }
}
