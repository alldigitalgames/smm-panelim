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
      parse_mode: 'HTML',
      disable_web_page_preview: true
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
      quantity: Number(orderData.quantity) || 1000,
    };

    const response = await axios.post(panel.api_url, payload, {
      timeout: 25000,
      headers: { 'Content-Type': 'application/json' }
    });

    const result = response.data;

    return {
      success: true,
      smm_order_id: result.order || result.order_id || "unknown",
      panel_name: panel.panel_name
    };
  } catch (err: any) {
    console.error(`[${panel.panel_name}] Hata:`, err.message);
    return { success: false, error: err.message };
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await request.json();

    const {
      order_id,
      email,
      service_name = "Bilinmeyen Hizmet",
      quantity = 1000,
      link,
      extra_info,
      username
    } = body;

    const finalLink = link || extra_info || username || null;

    // Tekrar tetiklenmeyi önleme (idempotency)
    if (order_id) {
      const { data: existing } = await supabase
        .from('orders')
        .select('id')
        .eq('itemsatis_order_id', order_id.toString())
        .single();

      if (existing) {
        console.log(`Sipariş zaten işlenmiş: ${order_id}`);
        return NextResponse.json({ success: true, message: "Already processed" });
      }
    }

    console.log(`🛒 Sipariş Alındı → ID: ${order_id} | Hizmet: ${service_name} | Link: ${finalLink ? 'VAR' : 'YOK'}`);

    const panels = await getActivePanels();
    if (panels.length === 0) {
      await sendTelegram(`❌ <b>Kritik Hata:</b> Aktif panel bulunamadı!\nSipariş ID: <code>${order_id}</code>`);
      return NextResponse.json({ error: "No active panels" }, { status: 503 });
    }

    let successResult = null;
    let usedPanel = "";
    let attempts = 0;

    for (const panel of panels) {
      attempts++;
      const result = await tryAddOrder(panel, { link: finalLink, quantity });

      if (result.success) {
        successResult = result;
        usedPanel = panel.panel_name;
        console.log(`✅ Başarılı → ${usedPanel} (Deneme ${attempts}/${panels.length})`);
        break;
      }
    }

    await supabase.from('orders').insert({
      itemsatis_order_id: order_id?.toString(),
      user_email: email,
      service_name,
      quantity: Number(quantity),
      link: finalLink,
      status: successResult ? "processing" : "failed",
      smm_order_id: successResult?.smm_order_id,
      used_panel: usedPanel,
      fail_reason: successResult ? null : (finalLink ? "Tüm paneller başarısız" : "Link eksik")
    });

    const duration = Date.now() - startTime;

    if (successResult) {
      const msg = `✅ <b>Sipariş Başarılı!</b>\n\n` +
                  `Sipariş ID: <code>${order_id}</code>\n` +
                  `Hizmet: ${service_name}\n` +
                  `Miktar: ${quantity}\n` +
                  `Link: ${finalLink || '—'}\n` +
                  `Panel: ${usedPanel}\n` +
                  `Süre: ${duration}ms`;

      await sendTelegram(msg);
    } else {
      const failMsg = `❌ <b>Sipariş Başarısız Oldu!</b>\n\n` +
                      `Sipariş ID: <code>${order_id}</code>\n` +
                      `Hizmet: ${service_name}\n` +
                      `Miktar: ${quantity}\n` +
                      `Link: ${finalLink || 'Eksik'}\n` +
                      `Deneme: ${attempts}/${panels.length}`;

      await sendTelegram(failMsg);
    }

    return NextResponse.json({
      success: !!successResult,
      used_panel: usedPanel,
      duration_ms: duration
    });

  } catch (error: any) {
    console.error("Webhook kritik hata:", error);
    await sendTelegram(`🚨 <b>Webhook Kritik Hata!</b>\n${error.message}`);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "Webhook Optimized v4 - 3 Panel Aktif",
    note: "Tekrar tetiklenme koruması + akıllı failover aktif"
  });
}
