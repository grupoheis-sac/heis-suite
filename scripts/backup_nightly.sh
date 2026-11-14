#!/usr/bin/env bash
# /opt/heis-suite/scripts/backup_nightly.sh
# Backup atómico de MySQL 8 + Storage SUNAT (XML/CDR/PFX), cifrado con GPG (AES-256) y subido a S3 / GCS.

set -euo pipefail
umask 077 # Garantiza que ningún archivo temporal sea legible por otros usuarios del sistema

# ==========================================
# 1. CONFIGURACIÓN Y VARIABLES
# ==========================================
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DATE_FOLDER=$(date +"%Y-%m")
BACKUP_ROOT="${BACKUP_ROOT:-/var/backups/heis-suite}"
WORK_DIR="${BACKUP_ROOT}/tmp_${TIMESTAMP}"
FINAL_ARCHIVE="${BACKUP_ROOT}/heis_backup_${TIMESTAMP}.tar.gz.gpg"
LOCAL_RETENTION_DAYS=${LOCAL_RETENTION_DAYS:-7}

# Cargar credenciales desde archivo protegido (chmod 600) si existe
if [ -f "/opt/heis-suite/.env.backup" ]; then
  source /opt/heis-suite/.env.backup
elif [ -f "./.env.backup" ]; then
  source ./.env.backup
fi

DB_NAME="${DB_NAME:-heis_suite_db}"
BUCKET_NAME="${BUCKET_NAME:-heis-suite-backups}"

mkdir -p "${WORK_DIR}"
mkdir -p "${BACKUP_ROOT}"

cleanup() {
  rm -rf "${WORK_DIR}"
}
trap cleanup EXIT

echo "[$(date --iso-8601=seconds)] Iniciando backup nocturno de HEIS Suite..."

# ==========================================
# 2. DUMP TRANSACCIONAL DE MYSQL 8 (SIN BLOQUEAR TABLAS INNODB)
# ==========================================
echo "[1/5] Extrayendo dump consistente de MySQL (--single-transaction)..."
docker exec heis_mysql sh -c \
  "MYSQL_PWD=\"\${MYSQL_ROOT_PASSWORD}\" mysqldump -u root \
  --single-transaction \
  --quick \
  --routines \
  --triggers \
  --events \
  --hex-blob \
  --set-gtid-purged=OFF \
  \"${DB_NAME}\"" | gzip -9 > "${WORK_DIR}/mysql_${DB_NAME}_${TIMESTAMP}.sql.gz"

# ==========================================
# 3. RESPALDO DE ARCHIVOS LEGALES SUNAT (XML, CDR, PDF y PFX)
# ==========================================
echo "[2/5] Copiando volúmenes de comprobantes SUNAT (storage) y certificados (certs)..."
docker run --rm \
  -v heis-suite-prod_heis_storage:/data/storage:ro \
  -v heis-suite-prod_heis_certs:/data/certs:ro \
  -v "${WORK_DIR}:/backup" \
  alpine:3.20 \
  tar -czf "/backup/sunat_vault_${TIMESTAMP}.tar.gz" -C /data storage certs

# ==========================================
# 4. EMPAQUETADO UNIFICADO Y CIFRADO GPG (AES-256)
# ==========================================
echo "[3/5] Cifrando backup con GPG (AES256)..."
GPG_PASS_ARG=""
if [ -f "/opt/heis-suite/.gpg_passphrase" ]; then
  GPG_PASS_ARG="--passphrase-file /opt/heis-suite/.gpg_passphrase"
elif [ -f "./.gpg_passphrase" ]; then
  GPG_PASS_ARG="--passphrase-file ./.gpg_passphrase"
elif [ -n "${GPG_PASSPHRASE:-}" ]; then
  GPG_PASS_ARG="--passphrase ${GPG_PASSPHRASE}"
fi

tar -czf - -C "${WORK_DIR}" . | gpg \
  --batch \
  --yes \
  --symmetric \
  --cipher-algo AES256 \
  --digest-algo SHA512 \
  --compress-algo none \
  ${GPG_PASS_ARG} \
  -o "${FINAL_ARCHIVE}"

# Generar firma de integridad SHA-256
sha256sum "${FINAL_ARCHIVE}" > "${FINAL_ARCHIVE}.sha256"

# ==========================================
# 5. SUBIDA A NUBE (SOPORTE AWS S3 / CLOUDFLARE R2 O GOOGLE CLOUD STORAGE)
# ==========================================
echo "[4/5] Subiendo paquete cifrado al almacenamiento en la nube..."

if [[ "${CLOUD_PROVIDER:-S3}" == "S3" && -n "${BUCKET_NAME:-}" ]]; then
  aws s3 cp "${FINAL_ARCHIVE}" "s3://${BUCKET_NAME}/backups/${DATE_FOLDER}/" \
    --storage-class STANDARD_IA \
    ${S3_ENDPOINT_URL:+--endpoint-url "$S3_ENDPOINT_URL"} || echo "Aviso: Error subiendo a S3"
  aws s3 cp "${FINAL_ARCHIVE}.sha256" "s3://${BUCKET_NAME}/backups/${DATE_FOLDER}/" \
    ${S3_ENDPOINT_URL:+--endpoint-url "$S3_ENDPOINT_URL"} || true
elif [[ "${CLOUD_PROVIDER:-}" == "GCS" && -n "${BUCKET_NAME:-}" ]]; then
  gcloud storage cp "${FINAL_ARCHIVE}" "gs://${BUCKET_NAME}/backups/${DATE_FOLDER}/" || echo "Aviso: Error subiendo a GCS"
  gcloud storage cp "${FINAL_ARCHIVE}.sha256" "gs://${BUCKET_NAME}/backups/${DATE_FOLDER}/" || true
fi

# ==========================================
# 6. ROTACIÓN DE BACKUPS LOCALES ANTIGUOS
# ==========================================
echo "[5/5] Purgando copias locales mayores a ${LOCAL_RETENTION_DAYS} días..."
find "${BACKUP_ROOT}" -maxdepth 1 -type f -name "heis_backup_*.gpg*" -mtime +${LOCAL_RETENTION_DAYS} -delete 2>/dev/null || true

echo "[$(date --iso-8601=seconds)] Backup completado exitosamente: $(basename "${FINAL_ARCHIVE}")"
