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

async function getActivePanels() {
  const { data } = await supabase
    .from('panel_configs')
    .select('*')
    .eq('is_active', true)
    .order('priority', { ascending: true });
  return data || [];
}

async function tryAddOrder(panel: any, orderData: any) {
  try {
    const payload = {
      key: panel.api_key,
      action: "add",
      service: panel.service_id || 1,
      link: orderData.link,
      quantity: Number(orderData.quantity) || 500,
    };

    const response = await axios.post(panel.api_url, payload, { timeout: 30000 });
    const data = response.data;

    const smmOrderId = data.order || data.order_id || data.id || null;

    return {
      success: true,
      smm_order_id: smmOrderId,
      panel_name: panel.panel_name,
      cost_price: 0.85
    };
  } catch (err: any) {
    console.error(`[${panel.panel_name}] Hata:`, err.message);
    return { success: false, error: err.message };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { order_id, email, service_name, quantity, link, extra_info, sales_price } = body;

    const finalLink = link || extra_info || null;
    const salesPrice = sales_price ? Number(sales_price) : null;

    if (!finalLink) {
      await sendTelegram(`⚠️ Link Eksik! Sipariş: ${order_id}`);
      return NextResponse.json({ error: "Link eksik" }, { status: 400 });
    }

    const panels = await getActivePanels();
    let successResult = null;
    let usedPanel = "";
    let attempt = 0;

    for (const panel of panels) {
      attempt++;
      const result = await tryAddOrder(panel, { link: finalLink, quantity });

      if (result.success) {
        successResult = result;
        usedPanel = panel.panel_name;
        console.log(`✅ Başarılı → ${panel.panel_name} (Deneme ${attempt})`);
        break;
      } else {
        console.log(`❌ Başarısız → ${panel.panel_name} (Deneme ${attempt})`);
      }
    }

    // Supabase Kaydı
    await supabase.from('orders').insert({
      itemsatis_order_id: order_id?.toString(),
      user_email: email,
      service_name: service_name || "Bilinmeyen Hizmet",
      quantity: Number(quantity) || 0,
      link: finalLink,
      sales_price: salesPrice,
      cost_price: successResult ? successResult.cost_price : null,
      status: successResult ? "processing" : "failed",
      smm_order_id: successResult?.smm_order_id,
      used_panel: usedPanel,
      fail_reason: successResult ? null : "Tüm paneller başarısız"
    });

    if (successResult) {
      await sendTelegram(`✅ Sipariş Başarılı!\nID: ${order_id}\nHizmet: ${service_name}\nPanel: ${usedPanel}\nSMM Order ID: ${successResult.smm_order_id || '—'}`);
    } else {
      await sendTelegram(`❌ Tüm Paneller Başarısız Oldu!\nID: ${order_id}\nHizmet: ${service_name}`);
    }

    return NextResponse.json({ success: !!successResult, used_panel: usedPanel });

  } catch (error: any) {
    console.error("Webhook genel hata:", error);
    await sendTelegram(`🚨 Webhook Genel Hata: ${error.message}`);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: "ok", message: "Full Failover Aktif" });
}
