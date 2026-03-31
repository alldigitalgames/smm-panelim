'use client';

export default function Home() {
  const runTestOrder = async () => {
    const res = await fetch('/api/test-order', { method: 'GET' });
    const data = await res.json();
    alert(JSON.stringify(data, null, 2));
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-5xl mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <h1 className="text-7xl font-bold mb-4 text-emerald-400">SMM Panelim</h1>
          <p className="text-2xl text-zinc-400">Otomatik ItemSatış + SMM Teslimat Sistemi</p>
        </div>

        <div className="bg-zinc-900 border border-emerald-500/30 rounded-3xl p-12 text-center mb-12">
          <div className="text-emerald-400 text-5xl mb-6">✅</div>
          <h2 className="text-4xl font-semibold mb-4">Sistem Aktif</h2>
          <p className="text-xl text-zinc-300 mb-8">
            2 Panel Aktif • Failover Çalışıyor • Telegram Bildirimi Aktif
          </p>

          <button
            onClick={runTestOrder}
            className="bg-emerald-500 hover:bg-emerald-600 text-black font-bold text-xl px-12 py-6 rounded-2xl transition transform hover:scale-105"
          >
            🚀 Test Siparişi Gönder (Telegram Bildirimi)
          </button>
        </div>

        <div className="text-center text-sm text-zinc-500">
          Webhook URL: <code className="bg-zinc-900 px-2 py-1 rounded">/api/webhook</code><br />
          Test butonuna basarak gerçek sipariş simülasyonu yapabilirsin.
        </div>
      </div>
    </div>
  );
}
