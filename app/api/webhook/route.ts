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
  } catch (e) {
    console.error("Telegram hatası:", e);
  }
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
      service: 1,
      link: orderData.link,
      quantity: orderData.quantity,
    };

    const res = await axios.post(panel.api_url, payload, { timeout: 20000 });
    return {
      success: true,
      smm_order_id: res.data.order || res.data.order_id || "unknown",
      panel_name: panel.panel_name
    };
  } catch {
    return { success: false };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { order_id, email, service_name, quantity, link } = body;

    const panels = await getActivePanels();
    let successResult = null;
    let usedPanel = "";

    for (const panel of panels) {
      const result = await tryAddOrder(panel, { link, quantity });
      if (result.success) {
        successResult = result;
        usedPanel = panel.panel_name;
        break;
      }
    }

    await supabase.from('orders').insert({
      itemsatis_order_id: order_id?.toString(),
      user_email: email,
      service_name: service_name || "Bilinmeyen Hizmet",
      quantity: Number(quantity) || 0,
      link,
      status: successResult ? "processing" : "failed",
      smm_order_id: successResult?.smm_order_id,
      used_panel: usedPanel
    });

    if (successResult) {
      const msg = `✅ <b>Sipariş Başarılı!</b>\n\nSipariş ID: <code>${order_id}</code>\nHizmet: ${service_name}\nMiktar: ${quantity}\nPanel: ${usedPanel}\nSMM ID: ${successResult.smm_order_id}`;
      await sendTelegram(msg);
      return NextResponse.json({ success: true });
    } else {
      await sendTelegram(`❌ Tüm paneller başarısız!\nSipariş ID: ${order_id}`);
      return NextResponse.json({ success: false }, { status: 502 });
    }
  } catch (error) {
    await sendTelegram(`🚨 Webhook Hatası!\n${error}`);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "SMM Panel Webhook + Telegram Bildirimi AKTİF",
    active_panels: "2 (MoreThanPanel + SMMKings)",
    telegram: "Aktif ✅"
  });
}
