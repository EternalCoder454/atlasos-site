import type { Metadata } from "next";
import { DocsUnavailable } from "@/components/docs/article";
import { DocsHeader } from "@/components/docs/header";
import { DocsNav } from "@/components/docs/nav";
import { navData } from "@/lib/docs/pages";
import { docsIndex } from "@/lib/docs/source";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { template: "%s · Telamon Framework API", default: "Telamon Framework API" },
};

export default async function DocsLayout({ children }: { children: React.ReactNode }) {
  const index = await docsIndex();
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-ink-2 focus:px-4 focus:py-2">
        Skip to content
      </a>
      <DocsHeader version={index?.version} released={index?.released} />
      <div className="mx-auto max-w-[90rem] px-4 pb-24 pt-8 sm:px-6 lg:grid lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-10">
        {index ? <DocsNav libraries={navData(index)} /> : <div />}
        <main id="main" className="min-w-0">
          {index ? children : <DocsUnavailable />}
        </main>
      </div>
    </>
  );
}
