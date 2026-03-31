import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

export async function GET() {
  try {
    // Aktif panelleri getir
    const { data: panels, error } = await supabase
      .from('panel_configs')
      .select('*')
      .eq('is_active', true)
      .order('priority');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      status: "success",
      message: "Test başarılı - Failover sistemi aktif",
      active_panels: panels.map(p => ({
        name: p.panel_name,
        priority: p.priority,
        url: p.api_url
      })),
      total_active_panels: panels.length,
      note: "Gerçek sipariş için ItemSatış webhook'unu kullanabilirsiniz."
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
