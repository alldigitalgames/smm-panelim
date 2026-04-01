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

    // TurkPaneli için geniş service ID aralığı
    const serviceIds = [1, 2, 3, 4, 5, 10, 11, 12, 15, 20, 25, 30, 35, 40, 50, 60, 70, 80, 90, 100];
    let smmOrderId = null;
    let usedService = null;
    let usedPanel = "turkpaneli";

    for (const servId of serviceIds) {
      const payload = {
        key: "45012f53fc16cebd045cc91151bdd4a5",
        action: "add",
        service: servId,
        link: finalLink,
        quantity: Number(quantity) || 500,
      };

      try {
        const response = await axios.post("https://turkpaneli.com/api/v2", payload, { timeout: 25000 });
        const data = response.data;

        if (data.order || data.order_id || data.id) {
          smmOrderId = data.order || data.order_id || data.id;
          usedService = servId;
          break;
        }
      } catch (err) {
        // sonraki ID'yi dene
      }
    }

    await supabase.from('orders').insert({
      itemsatis_order_id: order_id?.toString(),
      service_name: service_name || "Instagram Takipçi",
      quantity: Number(quantity) || 0,
      link: finalLink,
      sales_price: salesPrice,
      cost_price: 0.85,
      status: smmOrderId ? "processing" : "failed",
      smm_order_id: smmOrderId,
      used_panel: usedPanel,
      fail_reason: smmOrderId ? null : "TurkPaneli doğru service_id bulamadı"
    });

    if (smmOrderId) {
      await sendTelegram(`✅ Başarılı!\nSipariş ID: ${order_id}\nService ID: ${usedService}\nSMM Order ID: ${smmOrderId}`);
    } else {
      await sendTelegram(`❌ TurkPaneli Tüm Service ID'leri denedi ve başarısız oldu!\nSipariş ID: ${order_id}`);
    }

    return NextResponse.json({ success: !!smmOrderId });

  } catch (error: any) {
    await sendTelegram(`🚨 Genel Hata: ${error.message}`);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: "ok", message: "Service ID Auto Search Aktif" });
}
