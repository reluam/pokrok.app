import { GoogleCalendarConnect } from "../../../../components/settings/GoogleCalendarConnect";

export default function SettingsCalendarPage() {
  return (
    <div className="py-2">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
        Kalendář – nastavení
      </h1>
      <p className="mt-1 text-sm text-slate-600">
        Propojení s Google Kalendářem pro zohlednění událostí při rezervacích.
      </p>
      <div className="mt-8">
        <GoogleCalendarConnect />
      </div>
    </div>
  );
}
