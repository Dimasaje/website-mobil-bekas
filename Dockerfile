# Image produksi: Bun menjalankan API langsung dari TypeScript, web dibangun
# sekali di stage build lalu disajikan API (WEB_DIST_DIR).
FROM oven/bun:1 AS build

WORKDIR /app

# Manifes dulu supaya layer install di-cache selama dependensi tidak berubah.
COPY package.json bun.lock ./
COPY api/package.json api/
COPY db/package.json db/
COPY web/package.json web/
RUN bun install --frozen-lockfile

COPY . .
RUN bun run build

FROM oven/bun:1 AS runtime

WORKDIR /app
ENV NODE_ENV=production

# ponytail: node_modules disalin utuh termasuk devDependencies (~200 MB ekstra).
# Ganti dengan `bun install --production` di stage runtime bila ukuran image jadi masalah.
COPY --from=build /app/package.json /app/bun.lock ./
COPY --from=build /app/node_modules ./node_modules
# Bun workspace: link package db/hono/sharp/zod ada di api/node_modules, bukan root.
COPY --from=build /app/api/node_modules ./api/node_modules
COPY --from=build /app/api/package.json ./api/package.json
COPY --from=build /app/api/src ./api/src
COPY --from=build /app/db ./db
COPY --from=build /app/web/dist ./web/dist
COPY scripts/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh

# Uploads disimpan di /app/uploads (LocalStorageDriver memakai cwd); di-mount sebagai volume.
RUN chmod +x /usr/local/bin/docker-entrypoint.sh && mkdir -p /app/uploads

ENV WEB_DIST_DIR=/app/web/dist

EXPOSE 3001

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["bun", "api/src/index.ts"]
