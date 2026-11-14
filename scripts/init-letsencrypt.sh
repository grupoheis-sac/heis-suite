#!/usr/bin/env bash
# scripts/init-letsencrypt.sh
# Resuelve el arranque en frío (Cold Start) de Nginx + Certbot para HEIS Suite en producción.

set -euo pipefail

# ==========================================
# 1. CONFIGURACIÓN DEL DOMINIO Y ENTORNO
# ==========================================
DOMAINS=("suite.grupoheis.com") # Puedes agregar subdominios: ("suite.grupoheis.com" "api.grupoheis.com")
PRIMARY_DOMAIN="${DOMAINS[0]}"
EMAIL="admin@grupoheis.com"     # Correo para alertas de vencimiento de Let's Encrypt
STAGING=0                       # Cambia a 1 para pruebas (evita el límite de 5 certs/semana de Let's Encrypt)
RSA_KEY_SIZE=4096
COMPOSE_FILE="docker-compose.prod.yml"

if ! docker compose version >/dev/null 2>&1; then
  echo "❌ Error: 'docker compose' (v2) no está instalado." >&2
  exit 1
fi

echo "🚀 Iniciando aprovisionamiento SSL para: ${DOMAINS[*]}"

# ==========================================
# 2. CREAR CERTIFICADO DUMMY AUTOFIRMADO EN EL VOLUMEN DOCKER
# ==========================================
LIVE_PATH="/etc/letsencrypt/live/${PRIMARY_DOMAIN}"
echo "🔑 [1/5] Generando certificado autofirmado temporal para que Nginx pueda iniciar..."

docker compose -f "${COMPOSE_FILE}" run --rm --entrypoint "\
  sh -c 'mkdir -p ${LIVE_PATH} && \
  openssl req -x509 -nodes -newkey rsa:2048 -days 1 \
    -keyout ${LIVE_PATH}/privkey.pem \
    -out ${LIVE_PATH}/fullchain.pem \
    -subj \"/CN=localhost\"'" certbot

# ==========================================
# 3. LEVANTAR INFRAESTRUCTURA Y NGINX CON EL CERTIFICADO TEMPORAL
# ==========================================
echo "🐳 [2/5] Levantando MySQL, Redis, Server y Nginx..."
docker compose -f "${COMPOSE_FILE}" up -d mysql redis server
docker compose -f "${COMPOSE_FILE}" up -d --force-recreate nginx

echo "⏳ Esperando 5 segundos a que Nginx esté listo en el puerto 80..."
sleep 5

# ==========================================
# 4. ELIMINAR CERTIFICADO DUMMY ANTES DE SOLICITAR EL OFICIAL
# ==========================================
echo "🧹 [3/5] Eliminando certificado temporal para dar paso a Let's Encrypt..."
docker compose -f "${COMPOSE_FILE}" run --rm --entrypoint "\
  rm -Rf /etc/letsencrypt/live/${PRIMARY_DOMAIN} \
         /etc/letsencrypt/archive/${PRIMARY_DOMAIN} \
         /etc/letsencrypt/renewal/${PRIMARY_DOMAIN}.conf" certbot

# ==========================================
# 5. SOLICITAR CERTIFICADO OFICIAL A LET'S ENCRYPT (ACME HTTP-01)
# ==========================================
echo "📜 [4/5] Solicitando certificado TLS oficial a Let's Encrypt..."

DOMAIN_ARGS=""
for domain in "${DOMAINS[@]}"; do
  DOMAIN_ARGS="${DOMAIN_ARGS} -d ${domain}"
done

if [[ -z "${EMAIL}" ]]; then
  EMAIL_ARG="--register-unsafely-without-email"
else
  EMAIL_ARG="--email ${EMAIL}"
fi

STAGING_ARG=""
if [[ "${STAGING}" != "0" ]]; then
  STAGING_ARG="--staging"
  echo "⚠️  Modo STAGING activado (certificado de prueba no válido en navegadores)."
fi

docker compose -f "${COMPOSE_FILE}" run --rm --entrypoint "\
  certbot certonly --webroot -w /var/www/certbot \
    ${STAGING_ARG} \
    ${EMAIL_ARG} \
    ${DOMAIN_ARGS} \
    --rsa-key-size ${RSA_KEY_SIZE} \
    --agree-tos \
    --non-interactive \
    --force-renewal" certbot

# ==========================================
# 6. RECARGAR NGINX EN CALIENTE Y ACTIVAR DEMONIO DE RENOVACIÓN
# ==========================================
echo "🔄 [5/5] Recargando configuración de Nginx con el certificado oficial..."
docker compose -f "${COMPOSE_FILE}" exec nginx nginx -s reload

# Levantar el contenedor certbot en segundo plano para renovaciones automáticas cada 12h
docker compose -f "${COMPOSE_FILE}" up -d certbot

echo "✅ SSL Let's Encrypt configurado y activo en https://${PRIMARY_DOMAIN}"
