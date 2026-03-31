'use client';

export default function Home() {
  const sendTestOrder = async () => {
    const testData = {
      order_id: "TEST-" + Date.now(),
      email: "test@example.com",
      service_name: "Instagram Beğeni Test",
      quantity: 1000,
      link: "https://www.instagram.com/p/TEST123456789/"
    };

    try {
      const res = await fetch('/api/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testData)
      });

      const data = await res.json();
      
      if (res.ok) {
        alert("✅ Test siparişi başarıyla gönderildi!\n\nTelegram'a bildirim gitmiş olmalı.");
      } else {
        alert("❌ Hata: " + JSON.stringify(data));
      }
    } catch (err) {
      alert("Bağlantı hatası: " + err);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
      <div className="max-w-2xl text-center px-6">
        <h1 className="text-6xl font-bold mb-6 text-emerald-400">SMM Panelim</h1>
        <p className="text-2xl text-zinc-300 mb-12">Otomatik ItemSatış Teslimat Sistemi</p>

        <div className="bg-zinc-900 border border-emerald-500/30 rounded-3xl p-12 mb-10">
          <p className="text-emerald-400 text-xl mb-8">
            2 Panel Aktif • Failover Çalışıyor • Telegram Bildirimi Aktif
          </p>

          <button 
            onClick={sendTestOrder}
            className="bg-emerald-500 hover:bg-emerald-600 text-black font-bold text-2xl px-16 py-6 rounded-2xl transition-all hover:scale-105 active:scale-95"
          >
            🚀 Test Siparişi Gönder
          </button>

          <p className="text-zinc-500 text-sm mt-6">
            Butona bastığında test siparişi gönderilecek ve Telegram'a bildirim gelecek.
          </p>
        </div>

        <div className="text-xs text-zinc-600">
          Webhook URL: <code>/api/webhook</code>
        </div>
      </div>
    </div>
  );
}
