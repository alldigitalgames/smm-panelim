'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function SiparisLogPaneli() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Sipariş çekme hatası:", error);
    } else {
      setOrders(data || []);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-8 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-4xl font-bold text-emerald-400">ADG</div>
            <div>
              <div className="text-2xl font-bold tracking-tight">ALL DIGITAL GAMES</div>
              <div className="text-sm text-emerald-400 -mt-1">SMM Panel • Sipariş Kayıtları</div>
            </div>
          </div>
          <button 
            onClick={fetchOrders}
            className="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-sm transition flex items-center gap-2"
          >
            🔄 Yenile
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-8 py-12">
        <h1 className="text-4xl font-bold mb-10">Sipariş Logları</h1>

        {loading ? (
          <div className="text-center py-20 text-zinc-500">Yükleniyor...</div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20 text-zinc-500">Henüz hiç sipariş kaydı yok.</div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-zinc-800">
            <table className="w-full">
              <thead className="bg-zinc-900 border-b border-zinc-700">
                <tr>
                  <th className="px-6 py-5 text-left font-medium text-zinc-400">Sipariş No</th>
                  <th className="px-6 py-5 text-left font-medium text-zinc-400">Tarih & Saat</th>
                  <th className="px-6 py-5 text-left font-medium text-zinc-400">Hizmet</th>
                  <th className="px-6 py-5 text-left font-medium text-zinc-400">Kullanılan Panel</th>
                  <th className="px-6 py-5 text-left font-medium text-zinc-400">Durum</th>
                  <th className="px-6 py-5 text-left font-medium text-zinc-400">Link</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-zinc-900/50 transition-colors">
                    <td className="px-6 py-5 font-mono text-sm">{order.itemsatis_order_id || '-'}</td>
                    <td className="px-6 py-5 text-sm text-zinc-400">
                      {new Date(order.created_at).toLocaleString('tr-TR')}
                    </td>
                    <td className="px-6 py-5 text-zinc-200">{order.service_name}</td>
                    <td className="px-6 py-5">
                      <span className="px-4 py-1 bg-emerald-900/50 text-emerald-400 rounded-full text-xs">
                        {order.used_panel || '—'}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`px-4 py-1 rounded-full text-xs ${
                        order.status === 'completed' ? 'bg-green-900 text-green-400' :
                        order.status === 'processing' ? 'bg-amber-900 text-amber-400' : 
                        'bg-red-900 text-red-400'
                      }`}>
                        {order.status === 'completed' ? 'Tamamlandı' : 
                         order.status === 'processing' ? 'İşleniyor' : 'Başarısız'}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-sm text-zinc-500 truncate max-w-md">
                      {order.link ? order.link : '-'}
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
