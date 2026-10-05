import { llmsFull } from "@/lib/docs/llms";
import { docsIndex } from "@/lib/docs/source";

export const dynamic = "force-dynamic";

export async function GET() {
  const index = await docsIndex();
  const unavailable = () =>
    new Response("The docs can't be loaded right now. Try again in a minute.\n", {
      status: 503,
      headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
    });
  if (!index) return unavailable();
  try {
    return new Response(await llmsFull(index), {
      headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=300" },
    });
  } catch (e) {
    console.error(`docs: couldn't build llms-full.txt: ${(e as Error).message}`);
    return unavailable();
  }
}
