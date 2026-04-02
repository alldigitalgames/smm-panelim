'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useSearchParams } from 'next/navigation';

export default function CustomerOrderPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order');

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) return;

    const fetchOrder = async () => {
      const { data } = await supabase
        .from('orders')
        .select('itemsatis_order_id, smm_order_id, status, service_name, created_at')
        .eq('itemsatis_order_id', orderId)
        .single();

      setOrder(data);
      setLoading(false);
    };

    fetchOrder();
  }, [orderId]);

  if (loading) return <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">Yükleniyor...</div>;
  if (!order) return <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">Sipariş bulunamadı.</div>;

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-8">
      <div className="max-w-2xl mx-auto bg-zinc-900 rounded-3xl p-10">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-emerald-400">Sipariş Durumu</h1>
          <p className="text-zinc-400 mt-2">Sipariş No: {order.itemsatis_order_id}</p>
        </div>

        <div className="space-y-6">
          <div className="bg-zinc-800 p-6 rounded-2xl">
            <p className="text-zinc-400">Hizmet</p>
            <p className="text-xl font-medium">{order.service_name}</p>
          </div>

          <div className="bg-zinc-800 p-6 rounded-2xl">
            <p className="text-zinc-400">Durum</p>
            <p className={`text-2xl font-bold mt-1 ${
              order.status === 'processing' ? 'text-amber-400' : 
              order.status === 'completed' ? 'text-green-400' : 'text-red-400'
            }`}>
              {order.status === 'processing' ? '⏳ İşleniyor' : 
               order.status === 'completed' ? '✅ Tamamlandı' : '❌ Başarısız'}
            </p>
          </div>

          {order.smm_order_id && (
            <div className="bg-zinc-800 p-6 rounded-2xl">
              <p className="text-zinc-400">SMM Sipariş Numarası</p>
              <p className="text-xl font-mono font-medium text-emerald-400 mt-1">
                {order.smm_order_id}
              </p>
              <p className="text-xs text-zinc-500 mt-2">Bu numarayı panelde takip edebilirsiniz.</p>
            </div>
          )}
        </div>

        <div className="text-center mt-12 text-zinc-500 text-sm">
          Sorularınız için ItemSatış üzerinden mesaj atabilirsiniz.
        </div>
      </div>
    </div>
  );
}
