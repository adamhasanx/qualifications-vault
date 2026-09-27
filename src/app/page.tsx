import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import SignInButton from "../components/SignInButton";

export default async function Home() {
  const session = await getServerSession(authOptions);
  if (session) redirect("/dashboard");

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        <div className="mx-auto mb-6 h-14 w-14 rounded-2xl bg-gradient-to-br from-lilac to-blue flex items-center justify-center shadow-soft">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2l3.5 7 7.5 1-5.5 5.2 1.4 7.3L12 18.8 5.1 22.5l1.4-7.3L1 10l7.5-1L12 2z" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-ink tracking-tight">Qualifications Vault</h1>
        <p className="mt-3 text-muted leading-relaxed">
          Upload your certificates once. We'll read the details, track the renewal dates,
          and tell you exactly when something's about to lapse.
        </p>
        <div className="mt-8">
          <SignInButton />
        </div>
        <p className="mt-6 text-xs text-muted">
          Signing in creates a private vault tied to your Google account. Only you can see your certificates.
        </p>
      </div>
    </main>
  );
}
