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
    console.error("Telegram gönderim hatası:", e);
  }
}

async function getActivePanels() {
  const { data, error } = await supabase
    .from('panel_configs')
    .select('*')
    .eq('is_active', true)
    .order('priority', { ascending: true });

  if (error) {
    console.error("Panel configs hatası:", error);
    return [];
  }
  return data || [];
}

async function tryAddOrder(panel: any, orderData: any) {
  try {
    const payload = {
      key: panel.api_key,
      action: "add",
      service: 1,                    // İleride dinamik service ID yapılabilir
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
      smm_order_id: result.order || result.order_id || result.id || "unknown",
      panel_name: panel.panel_name,
      response: result
    };
  } catch (err: any) {
    console.error(`[${panel.panel_name}] Sipariş hatası:`, err.message);
    return { 
      success: false, 
      error: err.message,
      status: err.response?.status 
    };
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
      extra_info,        // ItemSatış bazen ekstra bilgi olarak gönderir
      username
    } = body;

    // Link algılama (en önemli optimizasyon)
    const finalLink = link || extra_info || username || null;

    console.log(`🛒 Yeni Sipariş Alındı → ID: ${order_id} | Hizmet: ${service_name} | Miktar: ${quantity} | Link: ${finalLink ? 'VAR' : 'YOK'}`);

    if (!finalLink) {
      await sendTelegram(`⚠️ <b>Link Eksik!</b>\n\nSipariş ID: <code>${order_id}</code>\nHizmet: ${service_name}\nMiktar: ${quantity}\n\nMüşteri link göndermemiş. Manuel kontrol edin.`);
    }

    const panels = await getActivePanels();
    if (panels.length === 0) {
      await sendTelegram(`❌ Kritik Hata: Aktif panel bulunamadı!\nSipariş ID: ${order_id}`);
      return NextResponse.json({ error: "No active panels" }, { status: 503 });
    }

    let successResult = null;
    let usedPanel = "";
    let attemptCount = 0;

    // Failover + Retry mantığı
    for (const panel of panels) {
      attemptCount++;
      const result = await tryAddOrder(panel, { link: finalLink, quantity });

      if (result.success) {
        successResult = result;
        usedPanel = panel.panel_name;
        console.log(`✅ Başarılı → Panel: ${usedPanel} (Deneme ${attemptCount})`);
        break;
      }
    }

    // Veritabanına kaydet
    const { error: dbError } = await supabase.from('orders').insert({
      itemsatis_order_id: order_id?.toString(),
      user_email: email,
      service_name: service_name || "Bilinmeyen Hizmet",
      quantity: Number(quantity) || 0,
      link: finalLink,
      status: successResult ? "processing" : "failed",
      smm_order_id: successResult?.smm_order_id,
      used_panel: usedPanel,
      fail_reason: successResult ? null : (finalLink ? "Tüm paneller başarısız" : "Link eksik")
    });

    if (dbError) console.error("DB kayıt hatası:", dbError);

    // Telegram Bildirimi
    if (successResult) {
      const successMsg = `✅ <b>Sipariş Başarılı!</b>\n\n` +
                        `Sipariş ID: <code>${order_id}</code>\n` +
                        `Hizmet: ${service_name}\n` +
                        `Miktar: ${quantity}\n` +
                        `Link: ${finalLink || '—'}\n` +
                        `Panel: ${usedPanel}\n` +
                        `SMM ID: ${successResult.smm_order_id}\n` +
                        `Süre: ${Date.now() - startTime}ms`;

      await sendTelegram(successMsg);
    } else {
      const failMsg = `❌ <b>Sipariş Başarısız!</b>\n\n` +
                      `Sipariş ID: <code>${order_id}</code>\n` +
                      `Hizmet: ${service_name}\n` +
                      `Miktar: ${quantity}\n` +
                      `Link: ${finalLink || 'Eksik'}\n` +
                      `Sebep: ${finalLink ? 'Paneller başarısız' : 'Link girilmemiş'}`;

      await sendTelegram(failMsg);
    }

    return NextResponse.json({
      success: !!successResult,
      used_panel: usedPanel,
      processing_time: Date.now() - startTime
    });

  } catch (error: any) {
    console.error("Webhook genel hata:", error);
    await sendTelegram(`🚨 <b>Webhook Hatası!</b>\nHata: ${error.message}`);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET - Test için
export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "Webhook Optimized + Telegram Active",
    panels: "2 Active",
    timestamp: new Date().toISOString()
  });
}
