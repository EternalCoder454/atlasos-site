# The site, as one image: the same three stages as the Eterneon site. What
# runs carries none of what built it, and Next's standalone output is a few
# megabytes of traced server rather than all of node_modules.

FROM node:22-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci


FROM node:22-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Substituted into the bundle at build time: canonical links, the sitemap
# and share cards all name this host.
ARG NEXT_PUBLIC_SITE_URL=https://atlasos.eterneon.net
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build


FROM node:22-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3060
ENV HOSTNAME=0.0.0.0
ENV DOWNLOADS_DIR=/data

# Not root. The only thing it writes is Next's own page cache, when the
# download section is rebuilt every few minutes.
RUN groupadd --system --gid 1003 site \
 && useradd --system --uid 1003 --gid site site

COPY --from=builder --chown=site:site /app/.next/standalone ./
COPY --from=builder --chown=site:site /app/.next/static ./.next/static
COPY --from=builder --chown=site:site /app/public ./public

USER site
EXPOSE 3060

CMD ["node", "server.js"]
