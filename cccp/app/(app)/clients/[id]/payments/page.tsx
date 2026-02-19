import { sql } from "../../../../../lib/db";

type PaymentRow = {
  id: string;
  amount: string;
  currency: string;
  paid_at: string;
  method: string | null;
  note: string | null;
};

async function getClientPayments(clientId: string): Promise<PaymentRow[]> {
  const rows = await sql`
    SELECT id, amount::text AS amount, currency, paid_at, method, note
    FROM payments
    WHERE client_id = ${clientId}
    ORDER BY paid_at DESC
  `;
  return rows as PaymentRow[];
}

export default async function ClientPaymentsPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const payments = await getClientPayments(id);

  return (
    <div className="py-2">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
        Platby
      </h1>
      <p className="mt-1 text-sm text-slate-600">
        Historie plateb od tohoto klienta.
      </p>
      <div className="mt-6 rounded-2xl bg-white/80 p-4 shadow-sm ring-1 ring-slate-100">
        {payments.length === 0 ? (
          <p className="text-sm text-slate-500">Zatím žádné platby.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {payments.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3"
              >
                <div>
                  <span className="font-medium text-slate-900">
                    {p.amount} {p.currency}
                  </span>
                  <span className="ml-2 text-slate-500">
                    {new Date(p.paid_at).toLocaleDateString("cs-CZ")}
                  </span>
                </div>
                <div className="text-xs text-slate-500">
                  {p.method ?? "—"}
                  {p.note ? ` · ${p.note}` : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
