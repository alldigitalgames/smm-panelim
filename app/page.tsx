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
      <header className="border-b border-zinc-200 bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Image 
              src="https://i.imgur.com/YourLogoHere.png" 
              alt="All Digital Games" 
              width={180} 
              height={50}
              className="h-12 w-auto"
            />
            <div className="text-2xl font-bold tracking-tight text-emerald-600">SMM Panel</div>
          </div>

          <div className="flex gap-10 text-sm font-medium">
            <a href="#services" className="hover:text-emerald-600 transition">Hizmetler</a>
            <a href="#orders" className="hover:text-emerald-600 transition">Siparişlerim</a>
            <a href="#" className="hover:text-emerald-600 transition">Bakiye</a>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-8 py-16">
        {/* Hero */}
        <div className="text-center mb-20">
          <h1 className="text-6xl font-bold mb-6 leading-tight">
            Profesyonel SMM Hizmetleri
          </h1>
          <p className="text-xl text-zinc-600 max-w-2xl mx-auto">
            ItemSatış satışlarınız otomatik olarak teslim edilir.<br />
            Hızlı, güvenilir ve tamamen otomatik sistem.
          </p>
        </div>

        {/* Hizmetler Bölümü */}
        <div id="services" className="mb-24">
          <div className="flex justify-between items-end mb-10">
            <h2 className="text-4xl font-bold">Hizmetlerimiz</h2>
            <p className="text-zinc-500">Popüler ve kaliteli hizmetler</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <div 
                key={index}
                className="group border border-zinc-200 hover:border-emerald-500 rounded-3xl p-8 transition-all duration-300 hover:shadow-xl bg-white"
              >
                {service.popular && (
                  <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 text-xs font-semibold px-4 py-1.5 rounded-full mb-6">
                    ⭐ En Çok Tercih Edilen
                  </div>
                )}

                <h3 className="text-2xl font-semibold mb-2 text-zinc-900">{service.name}</h3>
                <p className="text-zinc-500 mb-8">{service.category}</p>

                <div className="flex items-baseline mb-10">
                  <span className="text-5xl font-bold text-emerald-600">${service.rate}</span>
                  <span className="text-zinc-500 ml-2">/{service.unit}</span>
                </div>

                <button 
                  onClick={() => handleOrder(service.name)}
                  className="w-full bg-zinc-900 hover:bg-black text-white font-semibold py-4 rounded-2xl transition-all group-hover:bg-emerald-600 group-hover:text-white"
                >
                  Sipariş Ver
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Bilgi Bölümü */}
        <div className="bg-zinc-100 rounded-3xl p-12 text-center">
          <p className="text-lg text-zinc-600 max-w-xl mx-auto">
            Tüm siparişleriniz ItemSatış üzerinden otomatik olarak 2 farklı panele (MoreThanPanel + SMMKings) iletilir.<br />
            Bir panelde sorun olursa sistem otomatik olarak diğer panele geçer.
          </p>
        </div>
      </div>
    </div>
  );
}
