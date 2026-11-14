# apps/shell/Dockerfile
# Contexto de build: raíz del monorepo (.)

# ==========================================
# STAGE 1: Build del Monorepo Frontend (Vite + @heis/ui + @heis/core)
# ==========================================
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/shell/package.json ./apps/shell/
COPY packages/core/package.json ./packages/core/
COPY packages/ui/package.json ./packages/ui/
COPY server/package.json ./server/

RUN npm ci

# Copiar paquetes compartidos y aplicación shell
COPY packages/ ./packages/
COPY apps/shell/ ./apps/shell/

# Variables de entorno en tiempo de compilación para Vite
ARG VITE_API_URL=/api
ENV VITE_API_URL=${VITE_API_URL}

RUN npm run build --workspace=apps/shell

# ==========================================
# STAGE 2: Servidor Nginx de Producción
# ==========================================
FROM nginx:1.27-alpine AS runner

# Instalar curl para healthcheck y tzdata
RUN apk add --no-cache curl tzdata \
    && rm -f /etc/nginx/conf.d/default.conf

# Copiar artefactos estáticos compilados por Vite
COPY --from=builder /app/apps/shell/dist /usr/share/nginx/html

# Copiar configuración endurecida de Nginx
COPY nginx.prod.conf /etc/nginx/conf.d/heis-suite.conf

EXPOSE 80 443

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD curl -fsS http://localhost/nginx-health || exit 1

CMD ["nginx", "-g", "daemon off;"]
