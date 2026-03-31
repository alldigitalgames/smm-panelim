'use client';

import { useState } from 'react';

export default function CustomerPanel() {
  const [activeTab, setActiveTab] = useState<'services' | 'orders'>('services');

  const services = [
    { id: 1, name: "Instagram Beğeni", category: "Instagram", rate: "0.45", min: 50, max: 100000, popular: true },
    { id: 2, name: "Instagram Takipçi", category: "Instagram", rate: "1.85", min: 100, max: 50000, popular: true },
    { id: 3, name: "TikTok Beğeni", category: "TikTok", rate: "0.65", min: 100, max: 200000 },
    { id: 4, name: "YouTube Abone", category: "YouTube", rate: "2.40", min: 100, max: 10000 },
    { id: 5, name: "Twitter Retweet", category: "Twitter", rate: "1.20", min: 50, max: 50000 },
  ];

  const fakeOrders = [
    { id: "ORD-7842", service: "Instagram Beğeni", quantity: 2500, status: "completed", date: "Az önce" },
    { id: "ORD-7841", service: "TikTok Beğeni", quantity: 15000, status: "processing", date: "12 dakika önce" },
  ];

  const handleOrder = (service: any) => {
    alert(`${service.name} için sipariş oluşturma ekranı yakında aktif olacak!\n\nMiktar girip "Sipariş Ver" butonuna basabilirsiniz.`);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center font-bold text-2xl">S</div>
            <div>
              <div className="font-bold text-2xl">SMM Panelim</div>
              <div className="text-xs text-emerald-400 -mt-1">Otomatik Teslimat</div>
            </div>
          </div>
          
          <div className="flex gap-8 text-sm">
            <button 
              onClick={() => setActiveTab('services')}
              className={`pb-1 transition ${activeTab === 'services' ? 'border-b-2 border-emerald-400 text-emerald-400' : 'text-zinc-400 hover:text-white'}`}
            >
              Hizmetler
            </button>
            <button 
              onClick={() => setActiveTab('orders')}
              className={`pb-1 transition ${activeTab === 'orders' ? 'border-b-2 border-emerald-400 text-emerald-400' : 'text-zinc-400 hover:text-white'}`}
            >
              Siparişlerim
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {activeTab === 'services' && (
          <>
            <div className="text-center mb-12">
              <h1 className="text-5xl font-bold mb-4">Hizmetlerimiz</h1>
              <p className="text-zinc-400 text-lg">En hızlı ve kaliteli SMM hizmetleri • Otomatik teslimat</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((service) => (
                <div key={service.id} className="bg-zinc-900 border border-zinc-800 hover:border-emerald-500/50 rounded-3xl p-8 transition-all group">
                  {service.popular && (
                    <div className="inline-block bg-emerald-500 text-black text-xs font-bold px-4 py-1 rounded-full mb-4">⭐ EN POPÜLER</div>
                  )}
                  <h3 className="text-2xl font-semibold mb-2">{service.name}</h3>
                  <p className="text-zinc-500 mb-6">{service.category}</p>

                  <div className="flex items-end gap-2 mb-8">
                    <span className="text-5xl font-bold text-emerald-400">${service.rate}</span>
                    <span className="text-zinc-500 pb-1">/ 1000</span>
                  </div>

                  <div className="text-xs text-zinc-500 mb-6">
                    Min: {service.min} • Max: {service.max.toLocaleString()}
                  </div>

                  <button 
                    onClick={() => handleOrder(service)}
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-black font-semibold py-4 rounded-2xl transition transform group-hover:scale-105"
                  >
                    Sipariş Ver
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab === 'orders' && (
          <div>
            <h2 className="text-4xl font-bold mb-10">Siparişlerim</h2>
            <div className="space-y-4">
              {fakeOrders.map((order) => (
                <div key={order.id} className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 flex justify-between items-center">
                  <div>
                    <div className="font-semibold text-lg">{order.service}</div>
                    <div className="text-zinc-500">{order.quantity} adet • {order.date}</div>
                  </div>
                  <div className={`px-6 py-2 rounded-full text-sm font-medium ${order.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                    {order.status === 'completed' ? 'Tamamlandı' : 'İşleniyor'}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-center text-zinc-500 mt-12 text-sm">Gerçek siparişler burada görünecek</p>
          </div>
        )}
      </div>

      <footer className="border-t border-zinc-800 py-8 text-center text-zinc-600 text-sm">
        SMM Panelim • Otomatik ItemSatış Entegrasyonu • 2 Panel Aktif
      </footer>
    </div>
  );
}
