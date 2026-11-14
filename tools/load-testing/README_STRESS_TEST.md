# 🚀 Guía de Pruebas de Carga y Concurrencia Extrema (Stress & Race Conditions) — k6

Esta suite de pruebas de carga ha sido diseñada para certificar la estabilidad de **HEIS Suite** bajo condiciones de alta concurrencia multi-inquilino (multi-tenant), verificando que el aislamiento ACID, los bloqueos pesimistas (`LOCK.UPDATE`), la numeración correlativa SUNAT y el worker de contingencia operen sin condiciones de carrera (*Race Conditions*) ni bloqueos mutuos (*Deadlocks*).

---

## 📋 Arquitectura de la Prueba (150 VUs Concurrentes)

La prueba corre durante **3 minutos** simulando dos cargas de trabajo agresivas en paralelo:

| Escenario | VUs Concurrentes | Foco Técnico Evaluado | Endpoints Objetivos |
| :--- | :---: | :--- | :--- |
| **A: `pos_race_condition_test`** | **110 VUs** | • Contención extrema sobre los mismos productos y lotes.<br>• Unicidad de correlativos SUNAT (`uk_cpe_tenant_tipo_serie_correlativo`).<br>• Detección y prevención de Deadlocks mediante ordenamiento ascendente de IDs (`[A, B]` vs `[B, A]`).<br>• Cero stock negativo. | `POST /api/ferreteria/pos/venta`<br>`POST /api/botica/pos/venta` |
| **B: `sunat_xmldsig_saturation`** | **40 VUs** | • Sobrecarga de CPU por firmado digital XMLDSig RSA-SHA256.<br>• Generación UBL 2.1 con precisión de 6 decimales.<br>• Encolamiento y reintento en el worker de contingencia (`FOR UPDATE SKIP LOCKED`).<br>• Límite seguro de memoria heap V8 (tope 768 MB). | `POST /api/facturacion/emitir`<br>`POST /api/facturacion/comprobantes/:id/reintentar`<br>`GET /api/facturacion/comprobantes/:id/archivo/xml` |

---

## 🛠️ Instalación de k6

### En Windows
```powershell
winget install k6 --source winget
# O con Chocolatey:
choco install k6
```

### En Linux (Ubuntu / Debian)
```bash
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

---

## 🚦 Ejecución del Test de Carga

### 1. Contra el Servidor de Producción / Staging
```bash
k6 run -e BASE_URL=https://suite.grupoheis.com/api tools/load-testing/heis-stress-test.k6.js
```

### 2. Contra Entorno Local (Docker o Node directo)
```bash
k6 run -e BASE_URL=http://localhost:4000/api tools/load-testing/heis-stress-test.k6.js
```

### 3. Usando Tokens JWT Pre-generados (Opcional)
Si deseas evitar que la fase `setup()` ataque el endpoint de login:
```bash
k6 run \
  -e BASE_URL=https://suite.grupoheis.com/api \
  -e PREGENERATED_JWT_Tokens='{"1":"eyJ...","2":"eyJ...","3":"eyJ...","4":"eyJ...","5":"eyJ..."}' \
  tools/load-testing/heis-stress-test.k6.js
```

---

## 📊 Monitoreo de Recursos en Vivo (Terminal 2)

Durante la ejecución del test, ejecuta el siguiente comando en el servidor VPS para monitorear el comportamiento de los contenedores:

```bash
docker stats heis_server heis_mysql heis_redis heis_nginx
```

### Métricas de Salud Esperadas:
- **`heis_server` CPU:** Subirá al **140% – 185%** durante el pico de firmado XMLDSig (dentro del límite de 200% / 2.0 CPUs).
- **`heis_server` RAM:** Pasará de ~145 MB a **~480 MB – 560 MB** (dentro del límite seguro `NODE_OPTIONS="--max-old-space-size=768"`).
- **`heis_mysql` Locks:** No debe disparar errores `ER_LOCK_DEADLOCK` (umbral permitido: `< 3`).

---

## 🔍 Auditoría Post-Carga (Cero Condiciones de Carrera)

Una vez finalizada la prueba de k6, ejecuta el script SQL de auditoría contra la base de datos MySQL de producción:

```bash
docker exec -i heis_mysql mysql -u root -p"$DB_ROOT_PASS" heis_suite_prod < tools/load-testing/verify-post-load.sql
```

### Criterios de Aprobación Obligatorios:
1. **Correlativos Duplicados:** La consulta 1 **DEBE DEVOLVER 0 FILAS**.
2. **Huecos en Correlativos:** La columna `huecos_detectados` en la consulta 2 **DEBE SER 0**.
3. **Stock Negativo:** La consulta 3 **DEBE DEVOLVER 0 FILAS**. Si un producto se agotó durante el pico de 110 cajeros, el sistema debe haber respondido con HTTP 400 (`STOCK_INSUFICIENTE`), nunca permitiendo stock `< 0`.
4. **Worker de Contingencia:** La consulta 4 debe mostrar los comprobantes en estado `ACEPTADO`, `ACEPTADO_CON_OBSERVACIONES` o `CONTINGENCIA_REINTENTAR` con reintentos programados sin bloqueos.
