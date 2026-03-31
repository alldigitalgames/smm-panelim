import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';
import axios from 'axios';

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
      service: 1,                    // Şimdilik test için 1. service (sonra gerçek service id gelecek)
      link: orderData.link,
      quantity: orderData.quantity,
    };

    const response = await axios.post(panel.api_url, payload, {
      timeout: 20000,
      headers: { "Content-Type": "application/json" }
    });

    const result = response.data;

    return {
      success: true,
      smm_order_id: result.order || result.order_id || "unknown",
      panel_name: panel.panel_name,
      status: result.status || "success"
    };
  } catch (err: any) {
    console.error(`${panel.panel_name} paneli başarısız:`, err.message);
    return { success: false, error: err.message };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      order_id,          // ItemSatış sipariş ID
      email,
      service_name,
      quantity,
      link
    } = body;

    console.log(`🛒 Yeni sipariş geldi → Order ID: ${order_id} | ${service_name} | ${quantity} adet`);

    const panels = await getActivePanels();

    if (panels.length === 0) {
      return NextResponse.json({ error: "Aktif SMM paneli bulunamadı" }, { status: 503 });
    }

    let successResult = null;
    let usedPanel = "";

    // Failover mantığı: ilk başarılı olana kadar dene
    for (const panel of panels) {
      const result = await tryAddOrder(panel, { link, quantity });

      if (result.success) {
        successResult = result;
        usedPanel = panel.panel_name;
        break;
      }
    }

    // Siparişi veritabanına kaydet
    const { error: dbError } = await supabase.from('orders').insert({
      itemsatis_order_id: order_id?.toString(),
      user_email: email,
      service_name: service_name || "Bilinmeyen Hizmet",
      quantity: parseInt(quantity) || 0,
      link: link,
      status: successResult ? "processing" : "failed",
      smm_order_id: successResult?.smm_order_id,
      used_panel: usedPanel,
      fail_reason: successResult ? null : "Tüm paneller başarısız oldu"
    });

    if (dbError) console.error("Veritabanı kayıt hatası:", dbError);

    if (successResult) {
      console.log(`✅ Sipariş başarılı! Kullanılan panel: ${usedPanel} | SMM Order ID: ${successResult.smm_order_id}`);

      return NextResponse.json({
        success: true,
        message: "Sipariş SMM paneline iletildi",
        used_panel: usedPanel,
        smm_order_id: successResult.smm_order_id
      });
    } else {
      console.log("❌ Tüm paneller başarısız oldu");
      return NextResponse.json({
        success: false,
        message: "Tüm SMM panelleri başarısız oldu"
      }, { status: 502 });
    }

  } catch (error: any) {
    console.error("Webhook genel hata:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

// GET metodu - webhook'un çalıştığını test etmek için
export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "SMM Panel Webhook API aktif",
    timestamp: new Date().toISOString()
  });
}
