import { NextResponse } from 'next/server';
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

export async function GET() {
  try {
    // Bu kısım ItemSatış’tan siparişleri çekmek için (şu an simüle ediyoruz)
    // Gerçekte ItemSatış API'si veya scraping ile yapılacak
    const testOrder = {
      order_id: "POLL-" + Date.now(),
      service_name: "Instagram 500 Takipçi",
      quantity: 500,
      link: "https://www.instagram.com/testkullanici123/",
      sales_price: 9.9
    };

    // TurkPaneli’ne sipariş gönder
    const payload = {
      key: "45012f53fc16cebd045cc91151bdd4a5",
      action: "add",
      service: 1,
      link: testOrder.link,
      quantity: testOrder.quantity,
    };

    const response = await axios.post("https://turkpaneli.com/api/v2", payload, { timeout: 30000 });
    const data = response.data;
    const smmOrderId = data.order || data.order_id || null;

    // Supabase’e kaydet
    await supabase.from('orders').insert({
      itemsatis_order_id: testOrder.order_id,
      service_name: testOrder.service_name,
      quantity: testOrder.quantity,
      link: testOrder.link,
      sales_price: testOrder.sales_price,
      cost_price: 0.85,
      status: smmOrderId ? "processing" : "failed",
      smm_order_id: smmOrderId,
      used_panel: "turkpaneli"
    });

    await sendTelegram(`🔄 Polling Sistemi\nYeni Sipariş Tespit Edildi!\nID: ${testOrder.order_id}\nSMM Order ID: ${smmOrderId || '-'}`);

    return NextResponse.json({ success: true, message: "Polling testi başarılı" });

  } catch (error: any) {
    await sendTelegram(`❌ Polling Hatası: ${error.message}`);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
