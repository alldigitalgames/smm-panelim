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
      service: panel.service_id || 10,
      link: orderData.link,
      quantity: Number(orderData.quantity) || 500,
    };

    const response = await axios.post(panel.api_url, payload, { timeout: 30000 });
    const data = response.data;
    const smmOrderId = data.order || data.order_id || data.id || null;

    return {
      success: !!smmOrderId,
      smm_order_id: smmOrderId,
      panel_name: panel.panel_name
    };
  } catch (err) {
    return { success: false };
  }
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

    const panels = await getActivePanels();
    let successResult = null;
    let usedPanel = "";

    for (const panel of panels) {
      const result = await tryAddOrder(panel, { link: finalLink, quantity });
      if (result.success) {
        successResult = result;
        usedPanel = panel.panel_name;
        break;
      }
    }

    await supabase.from('orders').insert({
      itemsatis_order_id: order_id?.toString(),
      service_name: service_name || "Instagram Takipçi",
      quantity: Number(quantity) || 0,
      link: finalLink,
      sales_price: salesPrice,
      cost_price: 0.85,
      status: successResult ? "processing" : "failed",
      smm_order_id: successResult?.smm_order_id,
      used_panel: usedPanel || "denenmedi"
    });

    if (successResult) {
      await sendTelegram(`✅ Sipariş Başarılı!\nID: ${order_id}\nPanel: ${usedPanel}\nSMM Order ID: ${successResult.smm_order_id || '-'}`);
    } else {
      await sendTelegram(`❌ Sipariş Başarısız Oldu!\nID: ${order_id}\nTüm paneller denendi.`);
    }

    return NextResponse.json({ success: !!successResult });

  } catch (error: any) {
    await sendTelegram(`🚨 Sistem Hatası: ${error.message}`);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: "ok", message: "Final Version - 4 Panel Failover Aktif" });
}
