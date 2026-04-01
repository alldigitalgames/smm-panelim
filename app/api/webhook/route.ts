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
  const rawBody = await request.text();
  const headers = Object.fromEntries(request.headers.entries());

  console.log("[ITEMSATIS RAW BODY]", rawBody);
  console.log("[HEADERS]", headers);

  // Telegram’a her şeyi düşür (debugging)
  await sendTelegram(
    `📥 <b>ItemSatış’tan Webhook Geldi!</b>\n\n` +
    `Sipariş No: ${rawBody.includes('order_id') ? 'Var' : 'YOK'}\n` +
    `Raw Body:\n<pre>${rawBody.substring(0, 800)}</pre>\n\n` +
    `Headers:\n<pre>${JSON.stringify(headers, null, 2).substring(0, 800)}</pre>`
  );

  try {
    const body = JSON.parse(rawBody);
    const { order_id, service_name, quantity, link, extra_info } = body;

    const finalLink = link || extra_info || null;

    await sendTelegram(`✅ JSON Parse Başarılı!\nSipariş ID: ${order_id || 'YOK'}\nLink: ${finalLink || 'YOK'}`);

    if (!finalLink) {
      await sendTelegram(`⚠️ Link eksik! Sipariş: ${order_id}`);
      return NextResponse.json({ error: "Link eksik" }, { status: 400 });
    }

    // TurkPaneli’ne gönder
    const payload = {
      key: "45012f53fc16cebd045cc91151bdd4a5",
      action: "add",
      service: 1,
      link: finalLink,
      quantity: Number(quantity) || 500,
    };

    const response = await axios.post("https://turkpaneli.com/api/v2", payload, { timeout: 30000 });
    const data = response.data;
    const smmOrderId = data.order || data.order_id || data.id || null;

    await supabase.from('orders').insert({
      itemsatis_order_id: order_id?.toString(),
      service_name: service_name || "Instagram Takipçi",
      quantity: Number(quantity) || 0,
      link: finalLink,
      sales_price: 9.9,
      cost_price: 0.85,
      status: smmOrderId ? "processing" : "failed",
      smm_order_id: smmOrderId,
      used_panel: "turkpaneli"
    });

    await sendTelegram(`✅ TurkPaneli’ne sipariş gönderildi!\nSMM Order ID: ${smmOrderId || '-'}`);

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Genel hata:", error);
    await sendTelegram(`🚨 Webhook Parse Hatası: ${error.message}\nRaw Body: ${rawBody.substring(0, 300)}`);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: "ok", message: "Full Debugging Modu Aktif" });
}
