"use client";

import { DocsUnavailable } from "@/components/docs/article";

/* A page that couldn't be fetched or rendered (GitHub down, a timeout):
   the same message as when the docs can't be loaded at all. */
export default function DocsError() {
  return <DocsUnavailable />;
}
