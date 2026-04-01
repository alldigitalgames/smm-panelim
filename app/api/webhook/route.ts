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
      panel_name: panel.panel_name,
      cost_price: 0.85   // Örnek maliyet (gerçek maliyeti ileride dinamik yapacağız)
    };
  } catch (err: any) {
    console.error(`[${panel.panel_name}] Başarısız:`, err.message);
    return { success: false };
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

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

    console.log(`🛒 Yeni Sipariş: ${order_id} | ${service_name} | ${quantity} adet | Link: ${finalLink ? 'VAR' : 'YOK'}`);

    const panels = await getActivePanels();
    if (panels.length === 0) {
      await sendTelegram(`❌ Kritik: Aktif panel bulunamadı! Sipariş ID: ${order_id}`);
      return NextResponse.json({ error: "No active panels" }, { status: 503 });
    }

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
      fail_reason: successResult ? null : (finalLink ? "Tüm paneller başarısız" : "Link eksik")
    });

    // Telegram Bildirimi
    if (successResult) {
      const msg = `✅ <b>Sipariş Başarılı!</b>\n\nSipariş ID: <code>${order_id}</code>\nHizmet: ${service_name}\nMiktar: ${quantity}\nSatış Fiyatı: ${salesPrice ? '$' + salesPrice : '—'}\nKullanılan Panel: ${usedPanel}\nLink: ${finalLink || '—'}`;
      await sendTelegram(msg);
    } else {
      const failMsg = `❌ <b>Sipariş Başarısız Oldu!</b>\n\nSipariş ID: <code>${order_id}</code>\nHizmet: ${service_name}\nLink: ${finalLink ? 'Var' : 'Eksik'}\nDenenen Paneller: 4/4`;
      await sendTelegram(failMsg);
    }

    return NextResponse.json({
      success: !!successResult,
      used_panel: usedPanel || "Hiçbiri",
      processing_time: Date.now() - startTime + "ms"
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
    message: "Webhook Optimized - 4 Panel Failover Aktif",
    panels: "TurkPaneli → SmmTakipcimTR → MedyaBayim → MoreThanPanel",
    timestamp: new Date().toISOString()
  });
}
