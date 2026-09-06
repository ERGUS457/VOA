import { db } from '@/lib/db';
import { tariffSettings } from '@/lib/schema';
import TariffForm from './TariffForm';

export const metadata = { title: 'Pengaturan Tarif | VOA PLBN Aruk' };

export default async function TariffPage() {
  const settings = await db.select().from(tariffSettings).limit(1);
  const data = settings[0] || { voaPrice: '500000', serviceFee: '13500' };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Pengaturan Tarif</h1>
        <p className="text-slate-500 text-sm mt-1">Ubah biaya Visa On Arrival dan biaya layanan petugas secara real-time.</p>
      </div>
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <TariffForm initialVoaPrice={data.voaPrice} initialServiceFee={data.serviceFee} />
      </div>
    </div>
  );
}
