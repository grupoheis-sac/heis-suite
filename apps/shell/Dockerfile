# Stage 1: Build Vite React SPA
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar configuración de monorepo y dependencias
COPY package*.json ./
COPY packages/ ./packages/
COPY apps/shell/package*.json ./apps/shell/

RUN npm install

# Copiar el código fuente completo
COPY . .

# Compilar frontend
RUN npm --prefix apps/shell run build

# Stage 2: Nginx Web Server
FROM nginx:alpine

# Copiar configuración personalizada de Nginx
COPY nginx.conf /etc/nginx/nginx.conf

# Copiar archivos compilados al directorio de Nginx
COPY --from=builder /app/apps/shell/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
