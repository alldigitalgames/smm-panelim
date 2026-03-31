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
      service: 1,                    // Gerçek service ID ileride dinamik yapılacak
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

    const {
      order_id,
      email,
      service_name,
      quantity,
      link,           // ← Müşterinin girdiği Instagram linki (Ekstra Bilgi)
      extra_info      // ItemSatış bazen extra_info olarak da gönderebilir
    } = body;

    // Link kontrolü (ekstra bilgi veya link alanı)
    const finalLink = link || extra_info || null;

    console.log(`🛒 Yeni sipariş: ${order_id} | ${service_name} | ${quantity} adet | Link: ${finalLink || 'YOK'}`);

    const panels = await getActivePanels();
    let successResult = null;
    let usedPanel = "";

    // Failover mantığı
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
      status: successResult ? "processing" : "failed",
      smm_order_id: successResult?.smm_order_id,
      used_panel: usedPanel,
      fail_reason: successResult ? null : "Tüm paneller başarısız veya link eksik"
    });

    if (successResult) {
      const msg = `✅ <b>Sipariş Başarılı!</b>\n\n` +
                  `Sipariş ID: <code>${order_id}</code>\n` +
                  `Hizmet: ${service_name}\n` +
                  `Miktar: ${quantity}\n` +
                  `Link: ${finalLink || 'Link girilmemiş'}\n` +
                  `Panel: ${usedPanel}`;

      await sendTelegram(msg);
      return NextResponse.json({ success: true, panel: usedPanel });
    } else {
      const failMsg = `❌ Sipariş İşlenemedi!\n\nSipariş ID: ${order_id}\nHizmet: ${service_name}\nSebep: ${finalLink ? 'Paneller başarısız' : 'Instagram linki girilmemiş'}`;
      await sendTelegram(failMsg);
      return NextResponse.json({ success: false, reason: finalLink ? "Paneller başarısız" : "Link eksik" }, { status: 502 });
    }

  } catch (error: any) {
    console.error(error);
    await sendTelegram(`🚨 Webhook Genel Hata!\nSipariş ID: bilinmiyor\nHata: ${error.message}`);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "SMM Panel Webhook + Telegram Bildirimi AKTİF",
    active_panels: "2 (MoreThanPanel + SMMKings)",
    note: "Müşteri ItemSatış'ta 'Ekstra Bilgi' alanına Instagram linkini yazmalı"
  });
}
