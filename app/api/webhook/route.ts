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

    const finalLink = link || extra_info;
    const salesPrice = sales_price ? Number(sales_price) : 9.9;

    if (!finalLink) {
      await sendTelegram(`⚠️ Link eksik! Sipariş: ${order_id}`);
      return NextResponse.json({ error: "Link eksik" }, { status: 400 });
    }

    // TurkPaneli için doğru service_id = 10
    const payload = {
      key: "45012f53fc16cebd045cc91151bdd4a5",
      action: "add",
      service: 10,                    // Doğru bulunan ID
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
      sales_price: salesPrice,
      cost_price: 0.85,
      status: smmOrderId ? "processing" : "failed",
      smm_order_id: smmOrderId,
      used_panel: "turkpaneli"
    });

    if (smmOrderId) {
      await sendTelegram(`✅ Sipariş Başarılı!\nID: ${order_id}\nSMM Order ID: ${smmOrderId}\nPanel: TurkPaneli`);
    } else {
      await sendTelegram(`❌ Sipariş Başarısız!\nID: ${order_id}`);
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    await sendTelegram(`🚨 Hata: ${error.message}`);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: "ok", message: "Webhook Fixed - Service ID: 10" });
}
