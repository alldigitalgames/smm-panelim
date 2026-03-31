'use client';

import Image from 'next/image';

export default function CustomerPanel() {
  const services = [
    { name: "Instagram Beğeni", category: "Instagram", rate: "0.45", unit: "1000 beğeni", popular: true },
    { name: "Instagram Takipçi", category: "Instagram", rate: "1.85", unit: "1000 takipçi", popular: true },
    { name: "TikTok Beğeni", category: "TikTok", rate: "0.65", unit: "1000 beğeni" },
    { name: "YouTube Abone", category: "YouTube", rate: "2.40", unit: "1000 abone" },
    { name: "Twitter Retweet", category: "Twitter", rate: "1.20", unit: "1000 retweet" },
    { name: "Instagram Story İzlenme", category: "Instagram", rate: "0.35", unit: "1000 izlenme" },
  ];

  const handleOrder = (serviceName: string) => {
    alert(`${serviceName} için sipariş oluşturma ekranı yakında aktif olacak!`);
  };

  return (
    <div className="min-h-screen bg-white text-zinc-900">
      {/* Header */}
      <header className="border-b border-zinc-200 bg-white sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Image 
              src="https://i.imgur.com/m6LJN2h.png" 
              alt="All Digital Games" 
              width={220} 
              height={60}
              className="h-12 w-auto"
            />
            <div className="text-3xl font-bold text-emerald-600 tracking-tighter">SMM Panel</div>
          </div>

          <nav className="flex gap-10 text-sm font-medium">
            <a href="#services" className="hover:text-emerald-600 transition-colors">Hizmetler</a>
            <a href="#orders" className="hover:text-emerald-600 transition-colors">Siparişlerim</a>
            <a href="#" className="hover:text-emerald-600 transition-colors">Bakiye</a>
          </nav>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-8 py-16">
        {/* Hero */}
        <div className="text-center mb-20">
          <h1 className="text-6xl font-bold mb-6 text-zinc-900">Profesyonel SMM Hizmetleri</h1>
          <p className="text-xl text-zinc-600 max-w-2xl mx-auto">
            ItemSatış satışlarınız otomatik olarak teslim edilir.<br />
            Hızlı, güvenilir ve tamamen otomatik sistem.
          </p>
        </div>

        {/* Hizmetler - Yan Yana Grid */}
        <div id="services">
          <div className="flex justify-between items-end mb-12">
            <h2 className="text-4xl font-bold">Hizmetlerimiz</h2>
            <p className="text-zinc-500">En popüler ve kaliteli SMM hizmetleri</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <div 
                key={index}
                className="group border border-zinc-200 hover:border-emerald-500 hover:shadow-2xl rounded-3xl p-10 bg-white transition-all duration-300"
              >
                {service.popular && (
                  <div className="inline-flex bg-emerald-100 text-emerald-700 text-xs font-bold px-5 py-2 rounded-full mb-6">
                    ⭐ EN POPÜLER
                  </div>
                )}
                
                <h3 className="text-2xl font-semibold mb-3">{service.name}</h3>
                <p className="text-zinc-500 mb-10">{service.category}</p>

                <div className="flex items-baseline mb-12">
                  <span className="text-5xl font-bold text-emerald-600">${service.rate}</span>
                  <span className="text-zinc-500 ml-3">/ {service.unit}</span>
                </div>

                <button 
                  onClick={() => handleOrder(service.name)}
                  className="w-full bg-zinc-900 hover:bg-emerald-600 text-white font-semibold py-5 rounded-2xl transition-all group-hover:scale-105"
                >
                  Sipariş Ver
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <footer className="bg-zinc-100 py-12 text-center text-zinc-600 text-sm border-t">
        © All Digital Games • Otomatik SMM Panel • MoreThanPanel + SMMKings
      </footer>
    </div>
  );
}
