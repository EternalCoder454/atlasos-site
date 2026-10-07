# AtlasOS Site

The website for AtlasOS at https://telamon.eterneon.net, with the ISO
downloads. Next.js 16, Tailwind 4 and Motion, the same stack as the Eterneon
site; one page, no `src` directory.

```
npm run dev          # http://127.0.0.1:3060
npm run typecheck
npm run lint
deploy/deploy.sh     # build here, ship to eterneon-vps, restart
```

## Downloads

The ISOs (about 4 GB each) are built and uploaded by AtlasOS's CI
(`.github/workflows/iso.yml` in the AtlasOS repo) to `/srv/downloads/atlasos`
on the VPS, with an `<image>.json` naming the current version.

- The page's buttons go to `/download/<image>` (`app/download/[image]/route.ts`).
  It gives each address 8 links an hour and answers with a redirect to a
  signed link: `/dl/<file>.iso?md5=…&expires=…`, valid for 3 hours and only
  from the address that asked (`lib/signed-link.ts`).
- Caddy sends `/dl/*.iso` to `atlasos-dl`, an nginx (`deploy/nginx`) that
  checks the signature (`secure_link`) and limits downloads: 2 at a time per
  address, 6 in all, 20 requests a minute per address. The first two
  downloads get 10 MB/s, the next two 5 and the last two 3, so all of them
  together stay under 36 MB/s (about 300 Mbit/s). A download keeps the
  speed it started with, which nginx picks from how many responses it is
  sending (`$connections_writing`); error pages count too, so a burst of
  bad links can only slow new downloads, never raise the total. A
  client that stops reading loses its slot after 15 seconds. There's no
  AAAA record; before adding one, key nginx's limits on the /64 (the link
  limit already does).
- The route refuses to be embedded (`Sec-Fetch-Dest` iframe, image and the
  like), sends cross-site requests that weren't a click (no
  `Sec-Fetch-User`) back to the page, and ignores prefetches and HEAD, so
  none of those use up anyone's links.
- The site and the download server are on their own Docker network,
  `atlasos_inside` (172.29.0.0/24), shared only with Caddy, because both
  trust the `X-Real-IP` header Caddy sets.
  Busy, expired and missing get their own small pages (`deploy/nginx/errors`).
- `<image>.json` and the `.sha256` files stay public under `/dl/`, straight
  from Caddy: CI checks the upload through them.
- `robots.txt` keeps crawlers off `/download/` and `/dl/`, and the buttons
  are `rel="nofollow"`.

`DOWNLOAD_SECRET` is in `/srv/atlasos-site/.env` (mode 600), made by the
first deploy and shared by both containers.

## Deploying

`deploy/deploy.sh` builds the image with Podman here, loads it into the VPS's
Docker over SSH, copies `deploy/compose.yaml` and `deploy/nginx` to
`/srv/atlasos-site`, and runs `docker compose up -d`. The Caddy block is in
`deploy/Caddyfile.snippet`; the live copy is in `/srv/matrix/caddy/Caddyfile`.
