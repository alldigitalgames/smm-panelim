'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function SiparisLogPaneli() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [testLoading, setTestLoading] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) console.error(error);
    else setOrders(data || []);
    setLoading(false);
  };

  const sendTestOrder = async () => {
    setTestLoading(true);

    const testData = {
      order_id: "TEST-" + Date.now(),
      email: "test@alldigitalgames.com",
      service_name: "Instagram Beğeni Test",
      quantity: 2500,
      link: "https://www.instagram.com/testhesap123/"
    };

    try {
      const res = await fetch('/api/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testData)
      });

      const result = await res.json();

      if (res.ok) {
        alert("✅ Test siparişi başarıyla gönderildi!\nTelegram bildirimi kontrol edin.");
        fetchOrders();
      } else {
        alert("❌ Test başarısız:\n" + JSON.stringify(result, null, 2));
      }
    } catch (err: any) {
      alert("Bağlantı hatası: " + err.message);
    }

    setTestLoading(false);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <header className="border-b border-zinc-800 bg-zinc-900 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-8 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-4xl font-bold text-emerald-400">ADG</div>
            <div>
              <div className="text-2xl font-bold tracking-tight">ALL DIGITAL GAMES</div>
              <div className="text-sm text-emerald-400 -mt-1">SMM Panel • Otomatik Teslimat Logları</div>
            </div>
          </div>

          <div className="flex gap-4">
            <button 
              onClick={sendTestOrder}
              disabled={testLoading}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-zinc-700 rounded-2xl font-medium transition flex items-center gap-2"
            >
              {testLoading ? "Gönderiliyor..." : "🚀 Test Siparişi Gönder"}
            </button>

            <button 
              onClick={fetchOrders}
              className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-2xl font-medium transition"
            >
              🔄 Yenile
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-8 py-12">
        <h1 className="text-4xl font-bold mb-2">Sipariş Kayıtları</h1>
        <p className="text-zinc-500 mb-10">ItemSatış üzerinden gelen tüm siparişlerin otomatik logları</p>

        {loading ? (
          <p className="text-center py-20 text-zinc-500">Yükleniyor...</p>
        ) : orders.length === 0 ? (
          <p className="text-center py-20 text-zinc-500">Henüz sipariş kaydı bulunmuyor.</p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-zinc-800 bg-zinc-900">
            <table className="w-full">
              <thead>
                <tr className="bg-zinc-800 border-b border-zinc-700">
                  <th className="px-6 py-5 text-left font-medium text-zinc-400">Sipariş No</th>
                  <th className="px-6 py-5 text-left font-medium text-zinc-400">Tarih & Saat</th>
                  <th className="px-6 py-5 text-left font-medium text-zinc-400">Hizmet</th>
                  <th className="px-6 py-5 text-left font-medium text-zinc-400">Satış Fiyatı</th>
                  <th className="px-6 py-5 text-left font-medium text-zinc-400">Alım Maliyeti</th>
                  <th className="px-6 py-5 text-left font-medium text-zinc-400">Kullanılan Panel</th>
                  <th className="px-6 py-5 text-left font-medium text-zinc-400">Durum</th>
                  <th className="px-6 py-5 text-left font-medium text-zinc-400">Link</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-zinc-800/70 transition">
                    <td className="px-6 py-5 font-mono text-sm text-zinc-300">{order.itemsatis_order_id || '-'}</td>
                    <td className="px-6 py-5 text-sm text-zinc-400">
                      {new Date(order.created_at).toLocaleString('tr-TR')}
                    </td>
                    <td className="px-6 py-5 text-zinc-200 font-medium">{order.service_name}</td>
                    <td className="px-6 py-5 font-semibold text-emerald-400">
                      {order.sales_price ? `$${order.sales_price}` : '-'}
                    </td>
                    <td className="px-6 py-5 font-semibold text-amber-400">
                      {order.cost_price ? `$${order.cost_price}` : '-'}
                    </td>
                    <td className="px-6 py-5">
                      <span className="px-4 py-1 bg-emerald-900/60 text-emerald-400 rounded-full text-xs font-medium">
                        {order.used_panel || '—'}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`px-4 py-1 rounded-full text-xs font-medium ${
                        order.status === 'completed' ? 'bg-green-900 text-green-400' :
                        order.status === 'processing' ? 'bg-amber-900 text-amber-400' : 
                        'bg-red-900 text-red-400'
                      }`}>
                        {order.status === 'completed' ? '✅ Tamamlandı' : 
                         order.status === 'processing' ? '⏳ İşleniyor' : '❌ Başarısız'}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-sm text-zinc-500 truncate max-w-xs">
                      {order.link ? order.link.substring(0, 45) + '...' : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
