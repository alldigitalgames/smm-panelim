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
      cost_price: 0.85   // Gerçek maliyeti ileride dinamik yapacağız
    };
  } catch (err: any) {
    console.error(`[${panel.panel_name}] Sipariş hatası:`, err.message);
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
      service_name,
      quantity,
      link,
      extra_info,
      sales_price
    } = body;

    const finalLink = link || extra_info || null;
    const salesPrice = sales_price ? Number(sales_price) : null;

    console.log(`🛒 Yeni Sipariş Alındı → ID: ${order_id} | Hizmet: ${service_name} | Miktar: ${quantity} | Link: ${finalLink ? 'VAR' : 'YOK'}`);

    const panels = await getActivePanels();
    if (panels.length === 0) {
      await sendTelegram(`❌ Kritik Hata: Aktif panel bulunamadı!\nSipariş ID: ${order_id}`);
      return NextResponse.json({ error: "No active panels" }, { status: 503 });
    }

    let successResult = null;
    let usedPanel = "";
    let attempt = 0;

    // 4 Panel Failover + Log
    for (const panel of panels) {
      attempt++;
      const result = await tryAddOrder(panel, { link: finalLink, quantity });

      if (result.success) {
        successResult = result;
        usedPanel = panel.panel_name;
        console.log(`✅ Başarılı → Panel: ${usedPanel} (Deneme ${attempt}/4)`);
        break;
      }
    }

    // Veritabanına kaydet (Satış Fiyatı ve Alım Maliyeti dahil)
    await supabase.from('orders').insert({
      itemsatis_order_id: order_id?.toString(),
      user_email: email,
      service_name: service_name || "Bilinmeyen Hizmet",
      quantity: Number(quantity) || 0
