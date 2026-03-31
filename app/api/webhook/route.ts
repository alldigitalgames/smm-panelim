// Tekrar tetiklenmeyi önleme (idempotency)
const existingOrder = await supabase
  .from('orders')
  .select('id')
  .eq('itemsatis_order_id', order_id)
  .single();

if (existingOrder.data) {
  console.log(`Sipariş zaten işlenmiş: ${order_id}`);
  return NextResponse.json({ success: true, message: "Already processed" });
}
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
    return response.data || [];
  } catch (err) {
    console.error(`Services çekilemedi (${panel.panel_name}):`, err.message);
    return [];
  }
}

async function chooseBestPanel(service_name: string, quantity: number, salesPrice: number) {
  const { data: panels } = await supabase
    .from('panel_configs')
    .select('*')
    .eq('is_active', true)
    .order('priority', { ascending: true });

  let bestPanel = null;
  let bestScore = -999999;

  for (const panel of panels || []) {
    const services = await getServicesFromPanel(panel);
    
    // Hizmet adı eşleştirme (kısmi eşleşme)
    const matchingService = services.find((s: any) => 
      s.name && s.name.toLowerCase().includes(service_name.toLowerCase().slice(0, 20))
    );

    if (!matchingService) continue;

    const panelCostPer1000 = parseFloat(matchingService.rate) || 999;
    const panelCost = panelCostPer1000 * (quantity / 1000);
    const profit = salesPrice - panelCost;

    // Skor hesaplama: Kar + Başarı oranı + Stabilite
    let score = profit * 15;                    // Kar öncelikli
    score += (panel.success_rate || 95) * 3;    // Başarı oranı
    score -= (panel.error_count || 0) * 5;      // Hata cezası

    if (score > bestScore) {
      bestScore = score;
      bestPanel = {
        ...panel,
        estimated_cost: panelCost,
        estimated_profit: profit,
        service_rate: panelCostPer1000
      };
    }
  }

  return bestPanel;
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
      smm_order_id: result.order || result.order_id || "unknown",
      panel_name: panel.panel_name
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
      service_name = "Bilinmeyen Hizmet",
      quantity = 1000,
      link,
      extra_info,
      username,
      price: salesPrice = 0
    } = body;

    const finalLink = link || extra_info || username || null;

    console.log(`🛒 Sipariş Alındı → ID: ${order_id} | Hizmet: ${service_name} | Satış: $${salesPrice}`);

    // Akıllı Panel Seçimi (Fiyat + Karşılaştırma)
    const bestPanel = await chooseBestPanel(service_name, quantity, salesPrice);

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
      fail_reason: result.success ? null : "Seçilen panel başarısız"
    });

    const duration = Date.now() - startTime;

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
    await sendTelegram(`🚨 <b>Webhook Hatası!</b>\n${error.message}`);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "Fiyat Karşılaştırmalı Akıllı Webhook v1 Aktif",
    panels: "3 Panel (MoreThanPanel + SMMKings + Medyabayim)",
    note: "Hizmet fiyatları karşılaştırılarak en karlı panel seçiliyor"
  });
}
