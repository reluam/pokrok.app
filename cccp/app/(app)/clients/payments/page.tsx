import { sql } from "../../../../lib/db";
import Link from "next/link";

type PaymentRow = {
  id: string;
  client_id: string;
  amount: string;
  currency: string;
  paid_at: string;
  client_name: string;
};

async function getRecentPayments(): Promise<PaymentRow[]> {
  const rows = await sql`
    SELECT p.id, p.client_id, p.amount::text, p.currency, p.paid_at, c.name AS client_name
    FROM payments p
    JOIN clients c ON c.id = p.client_id
    ORDER BY p.paid_at DESC
    LIMIT 50
  `;
  return rows as PaymentRow[];
}

export default async function ClientsPaymentsPage() {
  const payments = await getRecentPayments();

  return (
    <div className="py-2">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
        Platby
      </h1>
      <p className="mt-1 text-sm text-slate-600">
        Přehled plateb od klientů.
      </p>
      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4">
        {payments.length === 0 ? (
          <p className="text-sm text-slate-500">Zatím žádné platby.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {payments.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2"
              >
                <div>
                  <span className="font-medium text-slate-900">{p.client_name}</span>
                  <span className="ml-2 text-slate-500">
                    {new Date(p.paid_at).toLocaleDateString("cs-CZ")}
                  </span>
                </div>
                <div className="font-medium text-slate-800">
                  {p.amount} {p.currency}
                </div>
                <Link
                  href={`/clients/${p.client_id}`}
                  className="text-xs text-slate-500 hover:text-slate-700"
                >
                  Detail klienta
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
