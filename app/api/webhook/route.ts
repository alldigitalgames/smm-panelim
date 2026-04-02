import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';
import axios from 'axios';

async function sendTelegram(message: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;
  try {
    await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
      chat_id: chatId,
      text: message,
      parse_mode: 'HTML'
    });
  } catch (e) {}
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { order_id, service_name, quantity, link, extra_info, sales_price } = body;

    const finalLink = link || extra_info || "Link yazılmamış!";

    const message = 
      `🛒 <b>Yeni Sipariş Geldi!</b>\n\n` +
      `Sipariş No: <code>${order_id}</code>\n` +
      `Hizmet: ${service_name || 'Bilinmiyor'}\n` +
      `Miktar: ${quantity || '-'}\n` +
      `Satış Fiyatı: ${sales_price ? '$' + sales_price : '-'}\n` +
      `Link: ${finalLink}\n\n` +
      `✅ Manuel işlem için hazır. Linki kopyalayıp TurkPaneli’ne gir.`;

    await sendTelegram(message);

    // Panelde de kaydedelim (manuel takip için)
    await supabase.from('orders').insert({
      itemsatis_order_id: order_id?.toString(),
      service_name: service_name || "Bilinmeyen Hizmet",
      quantity: Number(quantity) || 0,
      link: finalLink,
      sales_price: sales_price ? Number(sales_price) : null,
      status: "pending",                    // Manuel işlem bekliyor
      used_panel: "manuel",
      fail_reason: "Manuel işlem gerekiyor"
    });

    return NextResponse.json({ success: true, message: "Bildirim gönderildi" });

  } catch (error: any) {
    console.error("Webhook hatası:", error);
    await sendTelegram(`🚨 Webhook Genel Hata!\nHata: ${error.message}`);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ 
    status: "ok", 
    message: "Manuel Bildirim Modu Aktif - Webhook çalışıyor" 
  });
}
