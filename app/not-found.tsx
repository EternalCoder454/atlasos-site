import Link from "next/link";

export default function NotFound() {
  return (
    <main className="wrap grid min-h-screen place-items-center py-20">
      <div className="max-w-md">
        <h1 className="text-3xl font-semibold tracking-tight">Not found</h1>
        <p className="mt-3 text-text-2">There&apos;s nothing at this address.</p>
        <p className="mt-6">
          <Link href="/" className="text-violet-hi underline decoration-violet-hi/40 underline-offset-4 hover:decoration-violet-hi">
            Back to AtlasOS
          </Link>
        </p>
      </div>
    </main>
  );
}
