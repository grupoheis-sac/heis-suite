# server/Dockerfile
# Contexto de build: raíz del monorepo (.)

# ==========================================
# STAGE 1: Instalación de dependencias de producción
# ==========================================
FROM node:20-alpine AS deps
WORKDIR /app

# Copiar manifiestos del monorepo para cachear capas de npm ci
COPY package.json package-lock.json ./
COPY server/package.json ./server/
COPY packages/core/package.json ./packages/core/
COPY packages/ui/package.json ./packages/ui/
COPY apps/shell/package.json ./apps/shell/

# Instalar únicamente dependencias de producción del workspace server
RUN npm ci --workspace=server --omit=dev && npm cache clean --force

# ==========================================
# STAGE 2: Runtime endurecido de Producción
# ==========================================
FROM node:20-alpine AS runner
WORKDIR /app/server

# Instalar dumb-init y tzdata para hora exacta SUNAT (-05:00 America/Lima)
RUN apk add --no-cache dumb-init tzdata curl \
    && cp /usr/share/zoneinfo/America/Lima /etc/localtime \
    && echo "America/Lima" > /etc/timezone

ENV NODE_ENV=production \
    TZ=America/Lima \
    PORT=4000 \
    # Limita el Heap de V8 a 768MB para evitar que el OOM Killer de Linux mate el contenedor de 1GB
    NODE_OPTIONS="--max-old-space-size=768"

# Copiar node_modules limpios desde el stage deps
COPY --from=deps --chown=node:node /app/node_modules /app/node_modules
COPY --from=deps --chown=node:node /app/server/node_modules ./node_modules

# Copiar código fuente del servidor
COPY --chown=node:node server/package.json ./
COPY --chown=node:node server/src ./src

# Crear directorios persistentes para certificados PFX y XML/CDR con permisos restringidos (0700)
RUN mkdir -p /app/server/certs /app/server/storage \
    && chown -R node:node /app/server/certs /app/server/storage \
    && chmod 700 /app/server/certs /app/server/storage

USER node

EXPOSE 4000

HEALTHCHECK --interval=20s --timeout=5s --start-period=30s --retries=3 \
  CMD curl -fsS http://localhost:4000/health || exit 1

ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "src/index.js"]
