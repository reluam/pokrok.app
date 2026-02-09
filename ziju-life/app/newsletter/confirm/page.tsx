"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { CheckCircle, XCircle, Clock } from "lucide-react";

function NewsletterConfirmContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorType, setErrorType] = useState<string | null>(null);

  useEffect(() => {
    const success = searchParams.get("success");
    const error = searchParams.get("error");

    if (success === "true") {
      setStatus("success");
    } else if (error) {
      setStatus("error");
      setErrorType(error);
    } else {
      setStatus("loading");
    }
  }, [searchParams]);

  return (
    <main className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-white/50 paper-texture">
      <div className="max-w-2xl mx-auto text-center space-y-8 py-16">
        {status === "loading" && (
          <>
            <div className="flex justify-center">
              <Clock className="w-16 h-16 text-accent animate-spin" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              Potvrzuji odběr...
            </h1>
            <p className="text-lg text-foreground/70">
              Prosím počkej, zpracovávám tvou žádost.
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="flex justify-center">
              <CheckCircle className="w-16 h-16 text-green-600" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              Odběr potvrzen!
            </h1>
            <p className="text-lg text-foreground/70 leading-relaxed">
              Děkuji ti za potvrzení odběru newsletteru Žiju life. Od teď ti budu posílat novinky o tom, co je u mě nového.
            </p>
            <div className="pt-6">
              <Link
                href="/"
                className="inline-block px-6 py-3 bg-accent text-white rounded-full font-semibold hover:bg-accent-hover transition-colors"
              >
                Zpět na hlavní stránku
              </Link>
            </div>
          </>
        )}

        {status === "error" && (
          <>
            <div className="flex justify-center">
              {errorType === "expired" ? (
                <Clock className="w-16 h-16 text-orange-600" />
              ) : (
                <XCircle className="w-16 h-16 text-red-600" />
              )}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              {errorType === "expired"
                ? "Potvrzovací odkaz vypršel"
                : errorType === "invalid"
                ? "Neplatný potvrzovací odkaz"
                : errorType === "already_subscribed"
                ? "Email je již přihlášený"
                : "Chyba při potvrzování odběru"}
            </h1>
            <p className="text-lg text-foreground/70 leading-relaxed">
              {errorType === "expired" ? (
                <>
                  Potvrzovací odkaz vypršel (platí 24 hodin). Prosím{" "}
                  <Link href="/" className="text-accent underline">
                    přihlas se znovu
                  </Link>{" "}
                  a zkontroluj svůj email.
                </>
              ) : errorType === "invalid" ? (
                <>
                  Potvrzovací odkaz není platný. Prosím{" "}
                  <Link href="/" className="text-accent underline">
                    přihlas se znovu
                  </Link>{" "}
                  a zkontroluj svůj email.
                </>
              ) : errorType === "already_subscribed" ? (
                <>
                  Tento email je již přihlášený k newsletteru. Pokud chceš změnit nastavení, můžeš se{" "}
                  <Link href="/unsubscribe" className="text-accent underline">
                    odhlásit
                  </Link>
                  .
                </>
              ) : (
                <>
                  Při potvrzování odběru došlo k chybě. Prosím{" "}
                  <Link href="/" className="text-accent underline">
                    zkus to znovu
                  </Link>
                  .
                </>
              )}
            </p>
            <div className="pt-6">
              <Link
                href="/"
                className="inline-block px-6 py-3 bg-accent text-white rounded-full font-semibold hover:bg-accent-hover transition-colors"
              >
                Zpět na hlavní stránku
              </Link>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

export default function NewsletterConfirmPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-white/50 paper-texture">
        <div className="max-w-2xl mx-auto text-center space-y-8 py-16">
          <div className="flex justify-center">
            <Clock className="w-16 h-16 text-accent animate-spin" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            Načítám...
          </h1>
        </div>
      </main>
    }>
      <NewsletterConfirmContent />
    </Suspense>
  );
}
