import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="rounded-2xl bg-white p-6 shadow-lg shadow-slate-200">
        <SignIn />
      </div>
    </main>
  );
}

