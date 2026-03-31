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
    <div className="min-h-screen bg-white text-zinc-900">
      {/* Header */}
      <header className="border-b border-zinc-200 bg-white sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-8 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-4xl font-bold text-emerald-600">ADG</div>
            <div>
              <div className="text-2xl font-bold tracking-tight">ALL DIGITAL GAMES</div>
              <div className="text-sm text-emerald-600 -mt-1">SMM Panel • Sipariş Kayıtları</div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-8 py-12">
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-4xl font-bold">Sipariş Logları</h1>
          <button 
            onClick={fetchOrders}
            className="px-5 py-2 bg-zinc-100 hover:bg-zinc-200 rounded-xl text-sm font-medium transition"
          >
            Yenile
          </button>
        </div>

        {loading ? (
          <p className="text-center py-20 text-zinc-500">Yükleniyor...</p>
        ) : orders.length === 0 ? (
          <p className="text-center py-20 text-zinc-500">Henüz hiç sipariş kaydı yok.</p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-zinc-100">
            <table className="w-full">
              <thead className="bg-zinc-50">
                <tr>
                  <th className="px-6 py-4 text-left font-medium text-zinc-600">Sipariş No</th>
                  <th className="px-6 py-4 text-left font-medium text-zinc-600">Tarih & Saat</th>
                  <th className="px-6 py-4 text-left font-medium text-zinc-600">İlan / Hizmet</th>
                  <th className="px-6 py-4 text-left font-medium text-zinc-600">Kullanılan Panel</th>
                  <th className="px-6 py-4 text-left font-medium text-zinc-600">Durum</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-zinc-50">
                    <td className="px-6 py-5 font-mono text-sm">{order.itemsatis_order_id || '-'}</td>
                    <td className="px-6 py-5 text-sm">
                      {new Date(order.created_at).toLocaleString('tr-TR')}
                    </td>
                    <td className="px-6 py-5">{order.service_name}</td>
                    <td className="px-6 py-5">
                      <span className="px-4 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                        {order.used_panel || 'Belirtilmedi'}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`px-4 py-1 rounded-full text-xs font-medium ${
                        order.status === 'completed' || order.status === 'processing' 
                          ? 'bg-emerald-100 text-emerald-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {order.status === 'completed' ? 'Tamamlandı' : 
                         order.status === 'processing' ? 'İşleniyor' : 'Başarısız'}
                      </span>
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
