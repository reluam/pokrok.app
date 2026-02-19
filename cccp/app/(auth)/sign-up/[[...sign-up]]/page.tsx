import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="rounded-2xl bg-white p-6 shadow-lg shadow-slate-200">
        <SignUp />
      </div>
    </main>
  );
}

