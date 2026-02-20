import Link from "next/link";
import { BookingSlugSettings } from "../../../components/settings/BookingSlugSettings";
import { FirstDayOfWeekSettings } from "../../../components/settings/FirstDayOfWeekSettings";
import { PrimaryContactSettings } from "../../../components/settings/PrimaryContactSettings";

export default function SettingsPage() {
  return (
    <div className="px-1 py-2 sm:px-0">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
        Nastavení
      </h1>
      <p className="mt-1 text-sm text-slate-600">
        Základní nastavení CRM a kalendáře. Dostupnost pro rezervace nastavuješ u jednotlivých eventů v sekci Kalendář → Eventy.
      </p>
      <div className="mt-6 space-y-6">
        <BookingSlugSettings />
        <FirstDayOfWeekSettings />
        <PrimaryContactSettings />
        <Link
          href="/settings/calendar"
          className="block rounded-xl bg-white/80 px-4 py-3 shadow-sm ring-1 ring-slate-100 hover:bg-white"
        >
          <span className="font-medium text-slate-900">Kalendář</span>
          <p className="mt-0.5 text-xs text-slate-500">Propojení s Google Kalendářem</p>
        </Link>
      </div>
    </div>
  );
}

