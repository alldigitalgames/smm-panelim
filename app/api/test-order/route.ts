import { NextResponse } from 'next/server';

export async function GET() {
  // Test siparişi simülasyonu
  const testOrder = {
    order_id: "TEST-" + Date.now(),
    email: "test@ornek.com",
    service_name: "Instagram Beğeni",
    quantity: 1000,
    link: "https://instagram.com/p/TEST123"
  };

  // Webhook endpoint'ine POST isteği at
  const webhookUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://smm-panelim-4yesoo5u3-alldigitalgames-projects.vercel.app'}/api/webhook`;

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testOrder)
    });

    const result = await response.json();

    return NextResponse.json({
      success: true,
      message: "Test siparişi gönderildi",
      test_order_id: testOrder.order_id,
      webhook_response: result
    });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: "Test siparişi gönderilemedi" 
    }, { status: 500 });
  }
}
