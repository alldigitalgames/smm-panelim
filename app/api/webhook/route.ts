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
  const start = Date.now();
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

    const duration = Date.now() - start;

    return {
      success: true,
      smm_order_id: response.data.order || response.data.order_id || "unknown",
      panel_name: panel.panel_name,
      duration_ms: duration,
      cost_price: 0.85
    };
  } catch (err: any) {
    const duration = Date.now() - start;
    console.error(`[${panel.panel_name}] Başarısız (${duration}ms):`, err.message);
    return { 
      success: false, 
      error: err.message,
      duration_ms: duration 
    };
  }
}

export async function POST(request: NextRequest) {
  const totalStart = Date.now();

  try {
    const body = await request.json();

    const {
      order_id,
      email,
      service_name,
      quantity,
      link,
      extra_info,
      sales_price
    } = body;

    const finalLink = link || extra_info || null;
    const salesPrice = sales_price ? Number(sales_price) : null;

    console.log(`🛒 Yeni Sipariş: ${order_id} | ${service_name} | ${quantity} adet`);

    const panels = await getActivePanels();
    if (panels.length === 0) {
      await sendTelegram(`❌ Kritik: Aktif panel bulunamadı! Sipariş ID: ${order_id}`);
      return NextResponse.json({ error: "No active panels" }, { status: 503 });
    }

    let successResult = null;
    let usedPanel = "";
    let attempts = [];
    let attemptCount = 0;

    for (const panel of panels) {
      attemptCount++;
      const result = await tryAddOrder(panel, { link: finalLink, quantity });
      attempts.push({
        panel: panel.panel_name,
        success: result.success,
        duration_ms: result.duration_ms || 0
      });

      if (result.success) {
        successResult = result;
        usedPanel = panel.panel_name;
        console.log(`✅ Başarılı → ${usedPanel} (${result.duration_ms}ms)`);
        break;
      }
    }

    const totalDuration = Date.now() - totalStart;

    // Veritabanına kaydet
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
      fail_reason: successResult ? null : (finalLink ? "Tüm paneller başarısız" : "Link eksik"),
      processing_time_ms: totalDuration,
      attempts_count: attemptCount
    });

    // Telegram Bildirimi
    if (successResult) {
      const msg = `✅ <b>Sipariş Başarılı!</b>\n\n` +
                  `Sipariş ID: <code>${order_id}</code>\n` +
                  `Hizmet: ${service_name}\n` +
                  `Miktar: ${quantity}\n` +
                  `Satış Fiyatı: ${salesPrice ? '$' + salesPrice : '—'}\n` +
                  `Kullanılan Panel: ${usedPanel}\n` +
                  `Toplam Süre: ${totalDuration}ms\n` +
                  `Deneme Sayısı: ${attemptCount}`;

      await sendTelegram(msg);
    } else {
      const failMsg = `❌ <b>Sipariş Başarısız Oldu!</b>\n\n` +
                      `Sipariş ID: <code>${order_id}</code>\n` +
                      `Hizmet: ${service_name}\n` +
                      `Toplam Süre: ${totalDuration}ms\n` +
                      `Deneme Sayısı: ${attemptCount}/4`;

      await sendTelegram(failMsg);
    }

    return NextResponse.json({
      success: !!successResult,
      used_panel: usedPanel || "Hiçbiri",
      total_duration_ms: totalDuration,
      attempts: attemptCount
    });

  } catch (error: any) {
    console.error("Webhook hatası:", error);
    await sendTelegram(`🚨 Webhook Genel Hata!\nHata: ${error.message}`);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "Webhook Optimized + Performans İzleme Aktif",
    panels: "TurkPaneli → SmmTakipcimTR → MedyaBayim → MoreThanPanel",
    timestamp: new Date().toISOString()
  });
}
