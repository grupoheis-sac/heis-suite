-- scripts/verify-load-test.sql
-- Auditoría Cero Condiciones de Carrera y Validación Post-Carga k6
-- Ejecución: docker exec -i heis_mysql mysql -u root -p"$DB_ROOT_PASS" heis_suite_prod < scripts/verify-load-test.sql

-- ==============================================================================
-- 1. AUDITORÍA DE CORRELATIVOS SUNAT DUPLICADOS (Debe devolver 0 filas)
-- Valida la restricción estricta del índice uk_cpe_tenant_tipo_serie_correlativo
-- ==============================================================================
SELECT 
    empresa_id, 
    tipo_comprobante, 
    serie, 
    correlativo, 
    COUNT(*) AS veces_repetido
FROM comprobantes_electronicos
GROUP BY empresa_id, tipo_comprobante, serie, correlativo
HAVING COUNT(*) > 1;

-- ==============================================================================
-- 2. AUDITORÍA DE SALTOS (HUECOS) EN LA NUMERACIÓN CORRELATIVA POR TENANT Y SERIE
-- Si la asignación del correlativo se ejecutó al final de la transacción ACID,
-- (MAX - MIN + 1) - COUNT(*) debe resultar exactamente 0 (sin correlativos desperdiciados)
-- ==============================================================================
SELECT 
    empresa_id,
    tipo_comprobante,
    serie,
    MIN(correlativo) AS primer_correlativo,
    MAX(correlativo) AS ultimo_correlativo,
    COUNT(*) AS total_emitidos,
    (MAX(correlativo) - MIN(correlativo) + 1) - COUNT(*) AS huecos_detectados
FROM comprobantes_electronicos
GROUP BY empresa_id, tipo_comprobante, serie;

-- ==============================================================================
-- 3. AUDITORÍA DE QUIEBRES DE STOCK EN NEGATIVO (Debe devolver 0 filas en todas las tablas)
-- Demuestra matemáticamente que el bloqueo pesimista LOCK.UPDATE impidió sobreventa
-- ==============================================================================
SELECT 'ferreteria_productos' AS tabla, id, empresa_id, nombre, stock 
FROM productos WHERE stock < 0
UNION ALL
SELECT 'botica_medicamentos' AS tabla, id, empresa_id, nombre, stock 
FROM medicamentos WHERE stock < 0
UNION ALL
SELECT 'botica_lotes' AS tabla, id, empresa_id, codigo_lote AS nombre, cantidad_disponible AS stock 
FROM lotes WHERE cantidad_disponible < 0;

-- ==============================================================================
-- 4. ESTADO DE LA COLA DEL WORKER DE CONTINGENCIA SUNAT TRAS EL PICO DE ESTRÉS
-- Valida la resiliencia del worker ante ráfagas de comprobantes y reintentos (SKIP LOCKED)
-- ==============================================================================
SELECT 
    empresa_id,
    estado_sunat,
    COUNT(*) AS total_comprobantes,
    ROUND(AVG(intentos_envio), 2) AS promedio_intentos,
    MAX(intentos_envio) AS max_intentos
FROM comprobantes_electronicos
GROUP BY empresa_id, estado_sunat
ORDER BY empresa_id, estado_sunat;
