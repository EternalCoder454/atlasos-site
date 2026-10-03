import "server-only";
import { createHash } from "node:crypto";

/* A download link that only works for the address that asked for it, and
   only for a few hours. The download server (deploy/nginx) checks it with
   nginx's secure_link module, which is why it is MD5 in exactly this
   layout: secure_link_md5 "$secure_link_expires$uri$remote_addr SECRET".
   The secret comes last, so the hash can't be extended to another path,
   and without it no one can make a link at all.

   Long enough to finish a slow download and resume it; short enough that
   a link pasted on a forum is dead by the time anyone else tries it. */
export const LINK_LIFETIME_SECONDS = 6 * 60 * 60;

export function signedPath(file: string, ip: string, now = Date.now()): string {
  const secret = process.env.DOWNLOAD_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("DOWNLOAD_SECRET is missing or shorter than 32 characters");
  }
  const expires = Math.floor(now / 1000) + LINK_LIFETIME_SECONDS;
  const uri = `/dl/${file}`;
  const md5 = createHash("md5").update(`${expires}${uri}${ip} ${secret}`).digest("base64url");
  return `${uri}?md5=${md5}&expires=${expires}`;
}
