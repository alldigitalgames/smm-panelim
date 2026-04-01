'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function SiparisLogPaneli() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
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

  // Arama filtresi
  const filteredOrders = orders.filter(order =>
    (order.service_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (order.itemsatis_order_id?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (order.used_panel?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-8 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-4xl font-bold text-emerald-400">ADG</div>
            <div>
              <div className="text-2xl font-bold tracking-tight">ALL DIGITAL GAMES</div>
              <div className="text-sm text-emerald-400 -mt-1">SMM Panel • Gerçek Zamanlı Sipariş Kayıtları</div>
            </div>
          </div>
          <button 
            onClick={fetchOrders}
            className="flex items-center gap-2 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-2xl text-sm font-medium transition"
          >
            🔄 Yenile
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-8 py-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <h1 className="text-4xl font-bold">Gerçek Zamanlı Sipariş Kayıtları</h1>
          
          <div className="relative w-full md:w-96">
            <input
              type="text"
              placeholder="Sipariş No, Hizmet veya Panel ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 text-zinc-500">Yükleniyor...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-20 text-zinc-500">Henüz sipariş kaydı bulunmuyor veya arama kriterine uyan kayıt yok.</div>
        ) : (
          <div className="overflow-x-auto rounded-3xl border border-zinc-800 bg-zinc-900">
            <table className="w-full min-w-full">
              <thead>
                <tr className="bg-zinc-800 border-b border-zinc-700">
                  <th className="px-8 py-5 text-left font-medium text-zinc-400 w-48">Sipariş No</th>
                  <th className="px-8 py-5 text-left font-medium text-zinc-400 w-52">Tarih & Saat</th>
                  <th className="px-8 py-5 text-left font-medium text-zinc-400">Hizmet / İlan</th>
                  <th className="px-8 py-5 text-left font-medium text-zinc-400 w-40">Kullanılan Panel</th>
                  <th className="px-8 py-5 text-left font-medium text-zinc-400 w-32">Satış Fiyatı</th>
                  <th className="px-8 py-5 text-left font-medium text-zinc-400 w-32">Alım Maliyeti</th>
                  <th className="px-8 py-5 text-left font-medium text-zinc-400 w-40">Durum</th>
                  <th className="px-8 py-5 text-left font-medium text-zinc-400">Link</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-zinc-800/70 transition-colors">
                    <td className="px-8 py-6 font-mono text-sm text-zinc-300">{order.itemsatis_order_id || '-'}</td>
                    <td className="px-8 py-6 text-sm text-zinc-400">
                      {new Date(order.created_at).toLocaleString('tr-TR')}
                    </td>
                    <td className="px-8 py-6 text-zinc-200 font-medium">{order.service_name}</td>
                    <td className="px-8 py-6">
                      <span className="px-5 py-1.5 bg-emerald-900/60 text-emerald-400 rounded-full text-xs font-medium">
                        {order.used_panel || '—'}
                      </span>
                    </td>
                    <td className="px-8 py-6 font-semibold text-emerald-400">
                      {order.sales_price ? `$${order.sales_price}` : '-'}
                    </td>
                    <td className="px-8 py-6 font-semibold text-amber-400">
                      {order.cost_price ? `$${order.cost_price}` : '-'}
                    </td>
                    <td className="px-8 py-6">
                      <span className={`px-5 py-1.5 rounded-full text-xs font-medium ${
                        order.status === 'completed' ? 'bg-green-900 text-green-400' :
                        order.status === 'processing' ? 'bg-amber-900 text-amber-400' : 
                        'bg-red-900 text-red-400'
                      }`}>
                        {order.status === 'completed' ? '✅ Tamamlandı' : 
                         order.status === 'processing' ? '⏳ İşleniyor' : '❌ Başarısız'}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-sm text-zinc-500 truncate max-w-xs">
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
