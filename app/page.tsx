'use client';

import { useState } from 'react';

export default function Home() {
  const [loading, setLoading] = useState(false);

  const popularServices = [
    { name: "Instagram Beğeni", price: "0.45", unit: "1000 beğeni" },
    { name: "Instagram Takipçi", price: "1.85", unit: "1000 takipçi" },
    { name: "TikTok Beğeni", price: "0.65", unit: "1000 beğeni" },
    { name: "YouTube Abone", price: "2.40", unit: "1000 abone" },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center font-bold text-xl">S</div>
            <h1 className="text-2xl font-bold">SMM Panelim</h1>
          </div>
          <div className="flex gap-6 text-sm">
            <a href="#services" className="hover:text-emerald-400 transition">Hizmetler</a>
            <a href="#orders" className="hover:text-emerald-400 transition">Siparişlerim</a>
            <a href="#" className="hover:text-emerald-400 transition">Bakiye</a>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-16">
        {/* Hero Section */}
        <div className="text-center mb-20">
          <div className="inline-block bg-emerald-500/10 text-emerald-400 px-4 py-1.5 rounded-full text-sm mb-6">
            ⚡ Otomatik Teslimat Aktif
          </div>
          <h1 className="text-6xl font-bold mb-6 leading-tight">
            En Hızlı ve Güvenilir<br />
            <span className="text-emerald-400">SMM Paneli</span>
          </h1>
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
            ItemSatış'tan satış olduğunda siparişiniz otomatik olarak teslim edilir.<br />
            Hiçbir şey yapmanıza gerek yok.
          </p>
        </div>

        {/* Popüler Hizmetler */}
        <div id="services" className="mb-20">
          <h2 className="text-3xl font-bold mb-10 text-center">Popüler Hizmetler</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {popularServices.map((service, i) => (
              <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 hover:border-emerald-500 transition group">
                <div className="text-emerald-400 text-sm mb-3">EN ÇOK SATILAN</div>
                <h3 className="text-2xl font-semibold mb-6">{service.name}</h3>
                <div className="flex items-baseline gap-1 mb-8">
                  <span className="text-4xl font-bold">${service.price}</span>
                  <span className="text-zinc-500">/ {service.unit}</span>
                </div>
                <button 
                  onClick={() => alert('Bu hizmet yakında aktif olacak!')}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-black font-semibold py-4 rounded-2xl transition"
                >
                  Hemen Sipariş Ver
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Avantajlar */}
        <div className="grid md:grid-cols-3 gap-8 mb-20">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-10">
            <div className="text-5xl mb-6">⚡</div>
            <h3 className="text-2xl font-semibold mb-3">Anında Teslimat</h3>
            <p className="text-zinc-400">ItemSatış’tan sipariş gelir gelmez otomatik olarak SMM paneline iletilir.</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-10">
            <div className="text-5xl mb-6">🔄</div>
            <h3 className="text-2xl font-semibold mb-3">Otomatik Failover</h3>
            <p className="text-zinc-400">Bir panelde sorun çıkarsa otomatik olarak yedek panele geçer.</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-10">
            <div className="text-5xl mb-6">📈</div>
            <h3 className="text-2xl font-semibold mb-3">Tekrar Alım Kolaylığı</h3>
            <p className="text-zinc-400">"Tek Tıkla Tekrar Al" özelliği ile müşterileriniz kolayca yeniden sipariş verir.</p>
          </div>
        </div>

        <div className="text-center text-zinc-500 text-sm">
          Şu anda <span className="text-emerald-400">2 panel</span> aktif (MoreThanPanel + SMMKings)<br />
          Webhook aktif • Failover sistemi çalışıyor
        </div>
      </div>
    </div>
  );
}
