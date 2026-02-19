import { AvailabilitySettings } from "../../../components/settings/AvailabilitySettings";

export default function SettingsPage() {
  return (
    <div className="px-1 py-2 sm:px-0">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
        Nastavení
      </h1>
      <p className="mt-1 text-sm text-slate-600">
        Základní nastavení CRM, kalendáře a rezervací.
      </p>
      <div className="mt-6">
        <AvailabilitySettings />
      </div>
    </div>
  );
}

