import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';
import axios from 'axios';

async function getActivePanels() {
  const { data } = await supabase
    .from('panel_configs')
    .select('*')
    .eq('is_active', true)
    .order('priority', { ascending: true });
  return data || [];
}

async function sendTelegramNotification(message: string) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) return;

  try {
    await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      chat_id: chatId,
      text: message,
      parse_mode: 'HTML'
    });
  } catch (err) {
    console.error("Telegram bildirim hatası:", err);
  }
}

async function tryAddOrder(panel: any, orderData: any) {
  try {
    const payload = {
      key: panel.api_key,
      action: "add",
      service: 1,                    // Gerçek service_id daha sonra eklenecek
      link: orderData.link,
      quantity: orderData.quantity,
    };

    const response = await axios.post(panel.api_url, payload, { timeout: 20000 });
    const result = response.data;

    return {
      success: true,
      smm_order_id: result.order || result.order_id || "unknown",
      panel_name: panel.panel_name
    };
  } catch (err: any) {
    console.error(`${panel.panel_name} başarısız:`, err.message);
    return { success: false, error: err.message };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { order_id, email, service_name, quantity, link } = body;

    console.log(`🛒 Yeni sipariş: ${order_id} | ${service_name} | ${quantity} adet`);

    const panels = await getActivePanels();
    if (panels.length === 0) {
      await sendTelegramNotification(`❌ HATA: Aktif SMM paneli bulunamadı!\nSipariş ID: ${order_id}`);
      return NextResponse.json({ error: "Aktif panel yok" }, { status: 503 });
    }

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

    // Veritabanına kaydet
    await supabase.from('orders').insert({
      itemsatis_order_id: order_id?.toString(),
      user_email: email,
      service_name: service_name || "Bilinmeyen Hizmet",
      quantity: parseInt(quantity) || 0,
      link,
      status: successResult ? "processing" : "failed",
      smm_order_id: successResult?.smm_order_id,
      used_panel: usedPanel,
      fail_reason: successResult ? null : "Tüm paneller başarısız"
    });

    if (successResult) {
      const successMsg = `✅ Sipariş Başarılı!\n\n` +
                        `Sipariş ID: ${order_id}\n` +
                        `Hizmet: ${service_name}\n` +
                        `Miktar: ${quantity}\n` +
                        `Kullanılan Panel: ${usedPanel}\n` +
                        `SMM Order ID: ${successResult.smm_order_id}`;

      await sendTelegramNotification(successMsg);

      console.log(`✅ Başarılı - Panel: ${usedPanel}`);
      return NextResponse.json({ success: true, used_panel: usedPanel });
    } else {
      await sendTelegramNotification(`❌ Tüm paneller başarısız oldu!\nSipariş ID: ${order_id}`);
      return NextResponse.json({ success: false }, { status: 502 });
    }

  } catch (error: any) {
    console.error("Webhook hatası:", error);
    await sendTelegramNotification(`🚨 Webhook Genel Hata!\n${error.message}`);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "SMM Panel Webhook + Telegram Bildirimi Aktif",
    panels: "2 aktif (MoreThanPanel + SMMKings)"
  });
}
