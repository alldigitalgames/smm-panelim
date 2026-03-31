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

async function getServicesFromPanel(panel: any) {
  try {
    const response = await axios.post(panel.api_url, {
      key: panel.api_key,
      action: "services"
    }, { timeout: 15000 });
    return response.data;
  } catch {
    return [];
  }
}

async function getBestPanel(service_name: string, quantity: number, salesPrice: number) {
  const panels = await supabase
    .from('panel_configs')
    .select('*')
    .eq('is_active', true)
    .order('priority');

  let bestPanel = null;
  let bestScore = -1;

  for (const panel of panels.data || []) {
    const services = await getServicesFromPanel(panel);
    const matchingService = services.find((s: any) => 
      s.name && s.name.toLowerCase().includes(service_name.toLowerCase().slice(0, 15))
    );

    if (!matchingService) continue;

    const panelCost = parseFloat(matchingService.rate) * (quantity / 1000);
    const profit = salesPrice - panelCost;

    // Skor hesaplama: Kar + Başarı oranı + Hız
    let score = profit * 10;
    score += (panel.success_rate || 95) * 2;

    if (score > bestScore) {
      bestScore = score;
      bestPanel = { ...panel, estimated_cost: panelCost, estimated_profit: profit };
    }
  }

  return bestPanel;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      order_id,
      email,
      service_name = "Bilinmeyen Hizmet",
      quantity = 1000,
      link,
      extra_info,
      username,
      price: salesPrice = 0   // ItemSatış'tan gelen satış fiyatı
    } = body;

    const finalLink = link || extra_info || username || null;

    console.log(`🛒 Sipariş Alındı → ID: ${order_id} | Hizmet: ${service_name} | Satış Fiyatı: $${salesPrice}`);

    // Akıllı Panel Seçimi (Fiyat Karşılaştırmalı)
    const bestPanel = await getBestPanel(service_name, quantity, salesPrice);

    if (!bestPanel) {
      await sendTelegram(`❌ <b>Panel Seçilemedi!</b>\nSipariş ID: <code>${order_id}</code>\nHizmet: ${service_name}`);
      return NextResponse.json({ error: "No suitable panel" }, { status: 503 });
    }

    // Siparişi seçilen panele ver
    const result = await tryAddOrder(bestPanel, { link: finalLink, quantity });

    const status = result.success ? "processing" : "failed";

    await supabase.from('orders').insert({
      itemsatis_order_id: order_id?.toString(),
      user_email: email,
      service_name,
      quantity: Number(quantity),
      link: finalLink,
      status,
      smm_order_id: result.success ? result.smm_order_id : null,
      used_panel: bestPanel.panel_name,
      sales_price: salesPrice,
      cost_price: bestPanel.estimated_cost,
      fail_reason: result.success ? null : "Panel başarısız"
    });

    if (result.success) {
      const msg = `✅ <b>Sipariş Başarılı!</b>\n\n` +
                  `Sipariş ID: <code>${order_id}</code>\n` +
                  `Hizmet: ${service_name}\n` +
                  `Satış Fiyatı: $${salesPrice}\n` +
                  `Alım Maliyeti: $${bestPanel.estimated_cost.toFixed(2)}\n` +
                  `Kar: $${bestPanel.estimated_profit.toFixed(2)}\n` +
                  `Kullanılan Panel: ${bestPanel.panel_name}`;

      await sendTelegram(msg);
    } else {
      await sendTelegram(`❌ <b>Sipariş Başarısız!</b>\nSipariş ID: ${order_id}\nHizmet: ${service_name}\nSeçilen Panel: ${bestPanel.panel_name}`);
    }

    return NextResponse.json({
      success: result.success,
      used_panel: bestPanel.panel_name,
      estimated_profit: bestPanel.estimated_profit
    });

  } catch (error: any) {
    console.error("Webhook hata:", error);
    await sendTelegram(`🚨 Webhook Hatası!\n${error.message}`);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
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

    const response = await axios.post(panel.api_url, payload, { timeout: 25000 });
    const result = response.data;

    return {
      success: true,
      smm_order_id: result.order || result.order_id || "unknown"
    };
  } catch (err: any) {
    return { success: false };
  }
}

export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "Fiyat Karşılaştırmalı Webhook v1 Aktif",
    note: "Hizmet fiyatları karşılaştırılarak en uygun panel seçiliyor"
  });
}
