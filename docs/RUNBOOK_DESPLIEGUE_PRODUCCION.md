# 🚀 Runbook de Puesta en Marcha en Servidor de Producción (VPS / Cloud)

Este documento detalla la secuencia exacta para aprovisionar y desplegar **HEIS Suite** desde cero en un servidor VPS o dedicado (Ubuntu 22.04 / 24.04 LTS).

---

## 1. Requisitos Previos en el Servidor
- **Docker Engine** (24+) y **Docker Compose V2** (`docker compose version`).
- **Git**, **curl**, **openssl**, **dnsutils** (`dig`).
- Registro DNS tipo **A** apuntando `suite.grupoheis.com` a la IP pública del servidor.
- Puertos abiertos en Firewall (UFW / Security Groups):
  - `80/tcp` (HTTP y ACME Challenge de Let's Encrypt)
  - `443/tcp` (HTTPS TLS)
  - `22/tcp` (SSH)

---

## 2. Preparar Directorios y Secretos Criptográficos

```bash
# 1. Crear directorios base
sudo mkdir -p /opt/heis-suite /var/backups/heis-suite
cd /opt/heis-suite

# 2. Clonar el repositorio
git clone https://github.com/grupoheis-sac/heis-suite.git .

# 3. Generar la clave maestra AES-256-GCM (64 caracteres hex) para cifrar los .pfx en BD
openssl rand -hex 32

# 4. Generar el secreto de firma JWT
openssl rand -hex 64

# 5. Generar contraseña para backups cifrados GPG
openssl rand -base64 32 > /opt/heis-suite/.gpg_passphrase
```

---

## 3. Configurar Variables de Entorno

Crear `/opt/heis-suite/.env.production` a partir de la plantilla:

```bash
cp .env.production.example .env.production
nano .env.production
```

Crear `/opt/heis-suite/.env.backup`:

```bash
cp .env.backup.example .env.backup
nano .env.backup
```

Asegurar permisos estrictos de lectura:

```bash
chmod 600 /opt/heis-suite/.env.production
chmod 600 /opt/heis-suite/.env.backup
chmod 600 /opt/heis-suite/.gpg_passphrase
chmod 700 /opt/heis-suite/scripts/init-letsencrypt.sh
chmod 700 /opt/heis-suite/scripts/backup_nightly.sh
```

---

## 4. Verificar Registro DNS

```bash
dig +short suite.grupoheis.com
```
*Debe retornar la IP pública de tu VPS antes de continuar.*

---

## 5. Ejecutar el Bootstrap SSL (Por Única Vez)

Resuelve el arranque en frío de Nginx creando certificados temporales, levantando Nginx, solicitando el certificado oficial a Let's Encrypt y recargando Nginx:

```bash
cd /opt/heis-suite
./scripts/init-letsencrypt.sh
```

---

## 6. Verificación de Migraciones y Salud del Cluster

```bash
# Verificar estado de migraciones Sequelize
docker compose -f docker-compose.prod.yml exec server npm run migrate:status

# Healthcheck HTTP
curl -i https://suite.grupoheis.com/api/health
```

---

## 7. Automatización de Backups Nocturnos

Configurar en `/etc/crontab` o mediante `crontab -e`:

```cron
# Ejecutar backup nocturno a las 03:15 AM (Hora de Lima UTC-5)
15 3 * * * root /opt/heis-suite/scripts/backup_nightly.sh >> /var/log/heis_backup.log 2>&1
```

---

## 8. Despliegue Continuo (CI/CD)

Cada `git push origin main` activará automáticamente `.github/workflows/deploy-prod.yml`:
1. Valida el monorepo y la sintaxis ESM.
2. Compila y publica imágenes en GHCR.
3. Se conecta al VPS por SSH.
4. Hace un backup preventivo.
5. Ejecuta las migraciones pendientes en un contenedor efímero.
6. Actualiza Nginx y Server sin tiempo de inactividad.
7. Comprueba el healthcheck; si falla, ejecuta **Rollback Automático** a la versión anterior.
