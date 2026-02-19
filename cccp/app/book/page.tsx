import { Suspense } from "react";
import { BookingFlow } from "../../components/booking/BookingFlow";

export const metadata = {
  title: "Rezervovat termín | Coach CRM",
  description: "Rezervuj si termín pro úvodní hovor",
};

function BookingFallback() {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 md:p-8">
      <div className="h-8 w-48 animate-pulse rounded bg-slate-200" />
      <div className="mt-4 h-4 w-full animate-pulse rounded bg-slate-100" />
      <div className="mt-6 flex gap-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-10 w-24 animate-pulse rounded-lg bg-slate-100" />
        ))}
      </div>
    </div>
  );
}

export default function BookPage() {
  return (
    <main className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="mx-auto max-w-lg">
        <Suspense fallback={<BookingFallback />}>
          <BookingFlow />
        </Suspense>
      </div>
    </main>
  );
}
