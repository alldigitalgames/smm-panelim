'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function SiparisLogPaneli() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error(error);
      } else {
        setOrders(data || []);
      }
      setLoading(false);
    };

    fetchOrders();
  }, []);

  return (
    <div className="min-h-screen bg-white text-zinc-900">
      {/* Header */}
      <header className="border-b border-zinc-200 bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-8 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-4xl font-bold text-emerald-600">ADG</div>
            <div>
              <div className="text-2xl font-bold tracking-tight">ALL DIGITAL GAMES</div>
              <div className="text-sm text-emerald-600 -mt-1">SMM Panel - Sipariş Logları</div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-8 py-12">
        <h1 className="text-4xl font-bold mb-10">Sipariş Logları</h1>

        {loading ? (
          <p>Yükleniyor...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-zinc-100">
                  <th className="px-6 py-4 text-left font-medium">Sipariş No</th>
                  <th className="px-6 py-4 text-left font-medium">Tarih & Saat</th>
                  <th className="px-6 py-4 text-left font-medium">İlan Adı</th>
                  <th className="px-6 py-4 text-left font-medium">Satış Fiyatı</th>
                  <th className="px-6 py-4 text-left font-medium">Kullanılan Panel</th>
                  <th className="px-6 py-4 text-left font-medium">Alım Maliyeti</th>
                  <th className="px-6 py-4 text-left font-medium">Durum</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b hover:bg-zinc-50">
                    <td className="px-6 py-5 font-mono text-sm">{order.itemsatis_order_id}</td>
                    <td className="px-6 py-5 text-sm">
                      {new Date(order.created_at).toLocaleString('tr-TR')}
                    </td>
                    <td className="px-6 py-5">{order.service_name}</td>
                    <td className="px-6 py-5 font-semibold">
                      {order.sales_price ? `$${order.sales_price}` : '-'}
                    </td>
                    <td className="px-6 py-5">
                      <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                        {order.used_panel}
                      </span>
                    </td>
                    <td className="px-6 py-5 font-semibold">
                      {order.cost_price ? `$${order.cost_price}` : '-'}
                    </td>
                    <td className="px-6 py-5">
                      <span className={`px-4 py-1 rounded-full text-xs font-medium ${
                        order.status === 'completed' ? 'bg-green-100 text-green-700' :
                        order.status === 'processing' ? 'bg-amber-100 text-amber-700' : 
                        'bg-red-100 text-red-700'
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

        {orders.length === 0 && !loading && (
          <p className="text-center text-zinc-500 py-20">Henüz sipariş yok.</p>
        )}
      </div>
    </div>
  );
}
