'use client';

export default function Home() {
  const services = [
    { name: "Instagram Beğeni", category: "Instagram", rate: "0.45", unit: "1000 beğeni", popular: true },
    { name: "Instagram Takipçi", category: "Instagram", rate: "1.85", unit: "1000 takipçi", popular: true },
    { name: "TikTok Beğeni", category: "TikTok", rate: "0.65", unit: "1000 beğeni" },
    { name: "YouTube Abone", category: "YouTube", rate: "2.40", unit: "1000 abone" },
    { name: "Twitter Retweet", category: "Twitter", rate: "1.20", unit: "1000 retweet" },
    { name: "Instagram Story İzlenme", category: "Instagram", rate: "0.35", unit: "1000 izlenme" },
  ];

  const handleOrder = (name: string) => {
    alert(`${name} için sipariş ekranı yakında aktif olacak!`);
  };

  return (
    <div className="min-h-screen bg-white text-zinc-900">
      {/* Header */}
      <header className="border-b border-zinc-100 bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-8 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-4xl font-bold text-emerald-600">ADG</div>
            <div>
              <div className="text-2xl font-bold tracking-tight">ALL DIGITAL GAMES</div>
              <div className="text-sm -mt-1 text-emerald-600">SMM Panel</div>
            </div>
          </div>
          <nav className="flex gap-8 text-sm font-medium">
            <a href="#services" className="hover:text-emerald-600">Hizmetler</a>
            <a href="#" className="hover:text-emerald-600">Siparişlerim</a>
          </nav>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-8 py-20">
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold mb-6">Profesyonel SMM Hizmetleri</h1>
          <p className="text-xl text-zinc-600">ItemSatış satışlarınız otomatik olarak teslim edilir</p>
        </div>

        {/* Hizmetler Bölümü - Yan Yana */}
        <div id="services">
          <h2 className="text-4xl font-bold mb-12 text-center">Hizmetlerimiz</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <div 
                key={index}
                className="border border-zinc-200 hover:border-emerald-500 rounded-3xl p-10 transition-all hover:shadow-xl bg-white"
              >
                {service.popular && (
                  <div className="inline-block bg-emerald-100 text-emerald-700 text-xs font-bold px-4 py-1.5 rounded-full mb-6">
                    ⭐ EN POPÜLER
                  </div>
                )}
                
                <h3 className="text-2xl font-semibold mb-3">{service.name}</h3>
                <p className="text-zinc-500 mb-8">{service.category}</p>

                <div className="mb-10">
                  <span className="text-5xl font-bold text-emerald-600">${service.rate}</span>
                  <span className="text-zinc-500"> / {service.unit}</span>
                </div>

                <button 
                  onClick={() => handleOrder(service.name)}
                  className="w-full bg-zinc-900 hover:bg-emerald-600 text-white font-semibold py-4 rounded-2xl transition"
                >
                  Sipariş Ver
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
