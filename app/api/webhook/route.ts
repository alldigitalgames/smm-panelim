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

    const finalLink = link || extra_info || null;
    const salesPrice = sales_price ? Number(sales_price) : 9.9;

    if (!finalLink) {
      await sendTelegram(`⚠️ Link eksik! Sipariş: ${order_id}`);
      return NextResponse.json({ error: "Link eksik" }, { status: 400 });
    }

    // Sadece TurkPaneli (öncelik 1)
    const turkPanelPayload = {
      key: "45012f53fc16cebd045cc91151bdd4a5",
      action: "add",
      service: 1,
      link: finalLink,
      quantity: Number(quantity) || 500,
    };

    let smmOrderId = null;
    let usedPanel = "turkpaneli";

    try {
      const response = await axios.post("https://turkpaneli.com/api/v2", turkPanelPayload, { timeout: 30000 });
      const data = response.data;
      smmOrderId = data.order || data.order_id || data.id || null;
      console.log("TurkPaneli Response:", data);
    } catch (err: any) {
      console.error("TurkPaneli Hatası:", err.message);
      await sendTelegram(`❌ TurkPaneli Bağlantı Hatası: ${err.message}`);
    }

    // Supabase'e kaydet (hata yakalama ile)
    const { error } = await supabase.from('orders').insert({
      itemsatis_order_id: order_id?.toString(),
      service_name: service_name || "Instagram Takipçi",
      quantity: Number(quantity) || 0,
      link: finalLink,
      sales_price: salesPrice,
      cost_price: 0.85,
      status: smmOrderId ? "processing" : "failed",
      smm_order_id: smmOrderId,
      used_panel: usedPanel,
      fail_reason: smmOrderId ? null : "TurkPaneli başarısız"
    });

    if (error) {
      console.error("Supabase insert hatası:", error.message);
      await sendTelegram(`⚠️ Veritabanı Kayıt Hatası: ${error.message}`);
    }

    await sendTelegram(`✅ Sipariş İşleme Alındı!\nID: ${order_id}\nPanel: ${usedPanel}\nSMM Order ID: ${smmOrderId || '-'}`);

    return NextResponse.json({ success: true, smm_order_id: smmOrderId });

  } catch (error: any) {
    console.error("Genel hata:", error);
    await sendTelegram(`🚨 Genel Hata: ${error.message}`);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: "ok", message: "Basit TurkPaneli Modu" });
}
