export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-8">
      <div className="text-center max-w-md">
        <h1 className="text-6xl font-bold mb-6 text-emerald-500">SMM Panelim</h1>
        <p className="text-2xl text-zinc-300 mb-8">Otomatik ItemSatış + SMM Teslimat Sistemi</p>
        <div className="text-zinc-500 text-sm">
          Kurulum devam ediyor...<br />
          Webhook ve Failover yakında aktif olacak.
        </div>
      </div>
    </div>
  );
}
