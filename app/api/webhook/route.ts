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
  console.log(`[TRY] ${panel.panel_name} paneline sipariş gönderiliyor... Link: ${orderData.link}`);

  try {
    const payload = {
      key: panel.api_key,
      action: "add",
      service: 1,
      link: orderData.link,
      quantity: Number(orderData.quantity) || 1000,
    };

    const response = await axios.post(panel.api_url, payload, {
      timeout: 30000,
      headers: { 'Content-Type': 'application/json' }
    });

    console.log(`[SUCCESS] ${panel.panel_name} → Response:`, response.data);

    return {
      success: true,
      smm_order_id: response.data.order || response.data.order_id || "unknown",
      panel_name: panel.panel_name
    };
  } catch (err: any) {
    console.error(`[FAIL] ${panel.panel_name} → Hata:`, err.message);
    if (err.response) console.error(`[FAIL] Status: ${err.response.status} | Data:`, err.response.data);
    return { success: false, error: err.message };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { order_id, email, service_name, quantity, link, extra_info } = body;

    const finalLink = link || extra_info || null;

    console.log(`[NEW ORDER] ID: ${order_id} | Hizmet: ${service_name} | Miktar: ${quantity} | Link: ${finalLink || 'YOK'}`);

    if (!finalLink) {
      await sendTelegram(`⚠️ Link Eksik!\nSipariş ID: ${order_id}\nHizmet: ${service_name}`);
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
      user_email: email,
      service_name,
      quantity: Number(quantity) || 0,
      link: finalLink,
      status: successResult ? "processing" : "failed",
      smm_order_id: successResult?.smm_order_id,
      used_panel: usedPanel,
      fail_reason: successResult ? null : "Paneller başarısız veya link eksik"
    });

    if (successResult) {
      await sendTelegram(`✅ Sipariş Başarılı!\nID: ${order_id}\nHizmet: ${service_name}\nPanel: ${usedPanel}`);
    } else {
      await sendTelegram(`❌ Sipariş Başarısız!\nID: ${order_id}\nHizmet: ${service_name}\nLink: ${finalLink ? 'Var' : 'Eksik'}`);
    }

    return NextResponse.json({ success: !!successResult });

  } catch (error: any) {
    console.error("Webhook genel hata:", error);
    await sendTelegram(`🚨 Webhook Hatası!\nHata: ${error.message}`);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "Webhook Aktif - Detaylı Loglama Açık"
  });
}
