export default async function ClientNotesPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  await params;

  return (
    <div className="py-2">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
        Poznámky
      </h1>
      <p className="mt-1 text-sm text-slate-600">
        Poznámky k tomuto klientovi – připravujeme.
      </p>
      <div className="mt-8 rounded-xl border border-slate-200 bg-white p-8 text-center">
        <p className="text-slate-500">Tato sekce bude brzy k dispozici. Zatím můžeš přidávat poznámky u jednotlivých schůzek.</p>
      </div>
    </div>
  );
}
