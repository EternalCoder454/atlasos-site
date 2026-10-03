import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { imageIds, type ImageId } from "@/lib/images";

/* The current ISO of each image, from the <image>.json that AtlasOS's CI
   (iso.yml) uploads beside it. The container mounts that folder read-only
   at /data. A missing or malformed file means "no ISO yet", never an
   error page: the rest of the site does not depend on it. */

export type Release = {
  image: ImageId;
  version: string;
  file: string;
  size: number;
  sha256: string;
  date: string;
};

const dir = process.env.DOWNLOADS_DIR ?? "/data";

export async function currentRelease(image: ImageId): Promise<Release | null> {
  let raw: unknown;
  try {
    raw = JSON.parse(await readFile(path.join(dir, `${image}.json`), "utf8"));
  } catch {
    return null;
  }
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as Record<string, unknown>;
  const { version, file, size, sha256, date } = r;
  /* The file name ends up in a URL and a signature, so it has to be
     exactly the shape CI writes and nothing else. */
  if (
    typeof version !== "string" ||
    !/^44\.\d{8}$/.test(version) ||
    file !== `${image}-${version}.iso` ||
    typeof size !== "number" ||
    !Number.isSafeInteger(size) ||
    size <= 0 ||
    typeof sha256 !== "string" ||
    !/^[0-9a-f]{64}$/.test(sha256) ||
    typeof date !== "string"
  ) {
    return null;
  }
  return { image, version, file, size, sha256, date };
}

type Releases = Record<ImageId, Release | null>;

/* For the page: read at most every 30 seconds. A new ISO arrives once a
   week, and CI's upload puts <image>.json in place last. */
let cached: { at: number; releases: Promise<Releases> } | null = null;

export function currentReleases(now = Date.now()): Promise<Releases> {
  if (!cached || now - cached.at > 30_000) {
    cached = {
      at: now,
      releases: Promise.all(imageIds.map((id) => currentRelease(id))).then(
        (list) => Object.fromEntries(imageIds.map((id, i) => [id, list[i]])) as Releases,
      ),
    };
  }
  return cached.releases;
}
