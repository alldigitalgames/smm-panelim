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
    const { order_id, service_name = "Instagram Takipçi", quantity = 500, link, extra_info } = body;

    const finalLink = link || extra_info;

    if (!finalLink) {
      await sendTelegram(`⚠️ Link eksik!\nSipariş No: ${order_id}`);
      return NextResponse.json({ error: "Link eksik" }, { status: 400 });
    }

    // Sadece TurkPaneli (en basit hali)
    const payload = {
      key: "45012f53fc16cebd045cc91151bdd4a5",
      action: "add",
      service: 1,
      link: finalLink,
      quantity: Number(quantity),
    };

    const response = await axios.post("https://turkpaneli.com/api/v2", payload, { timeout: 30000 });
    const data = response.data;

    const smmOrderId = data.order || data.order_id || data.id || null;

    // Supabase'e kaydet
    await supabase.from('orders').insert({
      itemsatis_order_id: order_id?.toString(),
      service_name,
      quantity: Number(quantity),
      link: finalLink,
      sales_price: 9.9,
      cost_price: 0.85,
      status: smmOrderId ? "processing" : "failed",
      smm_order_id: smmOrderId,
      used_panel: "turkpaneli"
    });

    if (smmOrderId) {
      await sendTelegram(`✅ Sipariş Başarılı!\nID: ${order_id}\nSMM Order ID: ${smmOrderId}\nPanel: TurkPaneli`);
    } else {
      await sendTelegram(`❌ TurkPaneli Başarısız!\nID: ${order_id}\nCevap: ${JSON.stringify(data)}`);
    }

    return NextResponse.json({ success: !!smmOrderId });

  } catch (error: any) {
    console.error("Webhook hatası:", error.message);
    await sendTelegram(`❌ Webhook Hatası!\nSipariş: bilinmiyor\nHata: ${error.message}`);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: "ok", message: "Basit TurkPaneli Modu Aktif" });
}
