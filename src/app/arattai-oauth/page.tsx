import { InnerShell as PageShell } from "@/components/chrome-layout";
import { cardClass } from "@/lib/ui/classes";

export const dynamic = "force-dynamic";

export default async function ArattaiOauthPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; error?: string }>;
}) {
  const { code, error } = await searchParams;
  return (
    <PageShell>
      <div className={`${cardClass} mx-auto max-w-xl p-8`}>
        <p className="text-sm uppercase tracking-widest text-[var(--gold)]">Arattai setup</p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-2xl">Zoho login code</h1>
        {error ? <p className="mt-4 text-red-800">Zoho said: {error}. Start the login link again.</p> : null}
        {code ? (
          <>
            <p className="mt-4">Copy this whole code, then run the token command. It expires in about a minute.</p>
            <pre className="mt-3 overflow-x-auto whitespace-pre-wrap break-all rounded-xl bg-[var(--paper)] p-4 text-sm">
              {code}
            </pre>
          </>
        ) : (
          <p className="mt-4">
            No code yet. Open the Zoho login URL with redirect{" "}
            <code>https://shreelagna.vercel.app/arattai-oauth</code>.
          </p>
        )}
      </div>
    </PageShell>
  );
}
