# ============================================================================
# STAGE 1: Compilar Frontend Monorepo (apps/shell + packages/core + packages/ui)
# ============================================================================
FROM node:20-alpine AS frontend-builder

WORKDIR /app
COPY package*.json ./
COPY packages/ ./packages/
COPY apps/shell/package*.json ./apps/shell/

RUN npm install

COPY . .
RUN npm --prefix apps/shell run build

# ============================================================================
# STAGE 2: Contenedor Único Unificado (Node.js API + Frontend Estático)
# ============================================================================
FROM node:20-alpine AS production

WORKDIR /app

# Instalar dependencias de producción del servidor
COPY server/package*.json ./server/
RUN npm --prefix server install --omit=dev

# Copiar código del servidor y el build estático del frontend
COPY server/ ./server/
COPY --from=frontend-builder /app/apps/shell/dist ./apps/shell/dist

ENV NODE_ENV=production
ENV PORT=4000

EXPOSE 4000

CMD ["node", "server/src/index.js"]
