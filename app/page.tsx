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
    const { data } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });
    setOrders(data || []);
    setLoading(false);
  };

  const filteredOrders = orders.filter(order => 
    (order.service_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (order.itemsatis_order_id?.toString() || '').includes(searchTerm)
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
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
            className="flex items-center gap-2 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-2xl text-sm transition"
          >
            🔄 Yenile
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-8 py-12">
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-4xl font-bold">Gerçek Zamanlı Sipariş Kayıtları</h1>
          
          <input
            type="text"
            placeholder="Sipariş No veya Hizmet ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-zinc-900 border border-zinc-700 focus:border-emerald-500 rounded-2xl px-5 py-3 w-96 text-sm"
          />
        </div>

        {loading ? (
          <p className="text-center py-20 text-zinc-500">Yükleniyor...</p>
        ) : filteredOrders.length === 0 ? (
          <p className="text-center py-20 text-zinc-500">Henüz sipariş kaydı yok.</p>
        ) : (
          <div className="overflow-x-auto rounded-3xl border border-zinc-700 bg-zinc-900">
            <table className="w-full">
              <thead>
                <tr className="bg-zinc-800 border-b-2 border-zinc-600">
                  <th className="px-8 py-6 text-left font-medium text-zinc-400 w-56 border-r-4 border-zinc-700">Sipariş No</th>
                  <th className="px-8 py-6 text-left font-medium text-zinc-400 w-52 border-r-4 border-zinc-700">Tarih & Saat</th>
                  <th className="px-8 py-6 text-left font-medium text-zinc-400 border-r-4 border-zinc-700">Hizmet</th>
                  <th className="px-8 py-6 text-left font-medium text-zinc-400 w-44 border-r-4 border-zinc-700">Kullanılan Panel</th>
                  <th className="px-8 py-6 text-left font-medium text-emerald-400 w-40 border-r-4 border-zinc-700">Satış Fiyatı</th>
                  <th className="px-8 py-6 text-left font-medium text-amber-400 w-40 border-r-4 border-zinc-700">Alım Maliyeti</th>
                  <th className="px-8 py-6 text-left font-medium text-zinc-400 w-40 border-r-4 border-zinc-700">Durum</th>
                  <th className="px-8 py-6 text-left font-medium text-zinc-400">Müşteri Linki</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-zinc-800/60 transition-colors">
                    <td className="px-8 py-6 font-mono border-r-4 border-zinc-700">{order.itemsatis_order_id || '-'}</td>
                    <td className="px-8 py-6 text-sm border-r-4 border-zinc-700 text-zinc-400">
                      {new Date(order.created_at).toLocaleString('tr-TR')}
                    </td>
                    <td className="px-8 py-6 border-r-4 border-zinc-700 text-zinc-200">{order.service_name}</td>
                    <td className="px-8 py-6 border-r-4 border-zinc-700">
                      <span className="px-5 py-1.5 bg-emerald-900 text-emerald-400 rounded-full text-xs">
                        {order.used_panel || '—'}
                      </span>
                    </td>
                    <td className="px-8 py-6 border-r-4 border-zinc-700 font-semibold text-emerald-400">
                      {order.sales_price ? `$${order.sales_price}` : '-'}
                    </td>
                    <td className="px-8 py-6 border-r-4 border-zinc-700 font-semibold text-amber-400">
                      {order.cost_price ? `$${order.cost_price}` : '-'}
                    </td>
                    <td className="px-8 py-6 border-r-4 border-zinc-700">
                      <span className={`px-6 py-2 rounded-full text-xs font-medium ${
                        order.status === 'completed' ? 'bg-green-900 text-green-400' :
                        order.status === 'processing' ?
