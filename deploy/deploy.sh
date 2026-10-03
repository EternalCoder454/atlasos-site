#!/usr/bin/env bash
#
# Build the site here and ship it to eterneon-vps.
#
#   deploy/deploy.sh
#
# The image is built on this machine and loaded into the VPS's Docker, so the
# VPS spends no CPU or disk on a Node build (its root disk is the tight one).
# Then the compose file and the download server's config go to
# /srv/atlasos-site, and both services start or restart.
set -euo pipefail
cd "$(dirname "$0")/.."

host=eterneon-vps
dir=/srv/atlasos-site
url=https://atlasos.eterneon.net
rev=$(git rev-parse --short HEAD)
[ -z "$(git status --porcelain)" ] || rev="$rev-dirty"
# Quoted for the remote shell, whatever the commit subject holds.
subject=$(printf %q "$(git log -1 --pretty=%s | tr -d '\t')")

echo "building $rev"
podman build -q -t localhost/atlasos-site:local --build-arg NEXT_PUBLIC_SITE_URL="$url" . >/dev/null

echo "shipping the image"
# The image it replaces, removed once the new one runs. Only that one: the
# VPS's other stacks keep their images and build cache.
old=$(ssh "$host" "docker image inspect -f '{{.Id}}' atlasos/site:local 2>/dev/null || true")
podman save --format docker-archive localhost/atlasos-site:local |
	gzip -1 | ssh "$host" 'gunzip | docker load -q >/dev/null && docker tag localhost/atlasos-site:local atlasos/site:local && docker rmi localhost/atlasos-site:local >/dev/null'

echo "shipping the config"
# shellcheck disable=SC2029 # $dir is meant to expand here
ssh "$host" "[ -d $dir ] || sudo install -d -o \$(id -u) -g \$(id -g) $dir"
rsync -rt --delete --chmod=D755,F644 deploy/compose.yaml deploy/nginx "$host:$dir/"

echo "starting"
# shellcheck disable=SC2087 # $dir, $url, $old and $rev are meant to expand here
ssh "$host" bash -s <<EOF
set -euo pipefail
cd $dir
# The signing secret, made once and kept: changing it only invalidates the
# links handed out in the last few hours.
if [ ! -s .env ]; then
	umask 077
	printf 'DOWNLOAD_SECRET=%s\n' "\$(head -c 48 /dev/urandom | base64 | tr -d '/+=\n')" >.env
fi
# The stack's own network, shared only with Caddy. /srv/matrix/compose.yaml
# lists it for Caddy, so it survives Caddy being recreated; connecting the
# running Caddy here as well means no Caddy restart is needed.
docker network inspect atlasos_inside >/dev/null 2>&1 ||
	docker network create --subnet 172.29.0.0/24 atlasos_inside >/dev/null
caddy=\$(docker ps -q --filter label=com.docker.compose.project=matrix --filter label=com.docker.compose.service=caddy)
[ -n "\$caddy" ] || { echo "Caddy (the matrix stack's caddy service) isn't running"; exit 1; }
docker inspect "\$caddy" --format '{{range \$net, \$_ := .NetworkSettings.Networks}}{{\$net}} {{end}}' | grep -qw atlasos_inside ||
	docker network connect atlasos_inside "\$caddy"
docker compose up -d --remove-orphans
for i in \$(seq 1 30); do
	sleep 2
	[ "\$(docker compose ps --format '{{.Health}}' | sort -u)" = healthy ] && break
done
docker compose ps --format '{{.Service}} {{.Status}}'
[ -z "$old" ] || docker rmi "$old" >/dev/null 2>&1 || true
code=\$(curl -s -o /dev/null -w '%{http_code}' $url/ || echo 000)
echo "$url/ -> \$code"
[ "\$code" = 200 ] || { echo "not 200; check: docker compose logs --tail 50"; exit 1; }
{
	mkdir -p /var/lib/eterneon
	printf '%s\t%s\t%s\t%s\n' "\$(date -u +%Y-%m-%dT%H:%M:%SZ)" atlasos-site "$rev" $subject >>/var/lib/eterneon/deploys
	tail -50 /var/lib/eterneon/deploys >/var/lib/eterneon/deploys.next && mv /var/lib/eterneon/deploys.next /var/lib/eterneon/deploys
} 2>/dev/null || true
EOF
