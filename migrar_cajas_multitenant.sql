-- ============================================================================
-- HEIS SUITE - MIGRACIÓN SQL MULTI-TENANT E HISTORIAL DE CAJA UNIFICADO (CORE)
-- Compatible con MySQL 8.x / MariaDB
-- ============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 1. Crear tabla transversal de Cajas y Turnos (core_cajas)
CREATE TABLE IF NOT EXISTS `core_cajas` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `empresa_id` INT NOT NULL DEFAULT 1,
  `sucursal_id` INT DEFAULT NULL,
  `id_usuario` INT NOT NULL DEFAULT 1,
  `origen_modulo` VARCHAR(40) NOT NULL DEFAULT 'general' COMMENT 'general | restaurante | ferreteria | botica | hospedaje',
  `ref_legacy_id` INT DEFAULT NULL COMMENT 'ID original en la tabla del módulo antes de la migración',
  `monto_inicial` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `monto_final` DECIMAL(12,2) DEFAULT NULL,
  `total_ventas_efectivo` DECIMAL(12,2) DEFAULT 0.00,
  `total_ventas_digital` DECIMAL(12,2) DEFAULT 0.00,
  `total_ingresos` DECIMAL(12,2) DEFAULT 0.00,
  `total_egresos` DECIMAL(12,2) DEFAULT 0.00,
  `saldo_esperado` DECIMAL(12,2) DEFAULT NULL,
  `diferencia` DECIMAL(12,2) DEFAULT NULL,
  `fecha_apertura` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `fecha_cierre` DATETIME DEFAULT NULL,
  `estado` ENUM('Abierta', 'Cerrada') DEFAULT 'Abierta',
  `observaciones` TEXT DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_core_cajas_tenant_estado` (`empresa_id`, `sucursal_id`, `estado`),
  INDEX `idx_core_cajas_tenant_apertura` (`empresa_id`, `fecha_apertura`),
  INDEX `idx_core_cajas_legacy` (`origen_modulo`, `ref_legacy_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Crear tabla transversal de Movimientos de Caja (core_caja_movimientos)
CREATE TABLE IF NOT EXISTS `core_caja_movimientos` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `empresa_id` INT NOT NULL DEFAULT 1,
  `sucursal_id` INT DEFAULT NULL,
  `id_caja` INT NOT NULL,
  `id_usuario` INT NOT NULL DEFAULT 1,
  `origen_modulo` VARCHAR(40) NOT NULL DEFAULT 'general',
  `tipo` ENUM('Ingreso', 'Egreso') NOT NULL,
  `metodo_pago` VARCHAR(40) DEFAULT 'Efectivo',
  `concepto` VARCHAR(255) NOT NULL,
  `comprobante` VARCHAR(60) DEFAULT NULL,
  `monto` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `fecha` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_core_mov_tenant_caja` (`empresa_id`, `id_caja`, `tipo`),
  CONSTRAINT `fk_core_mov_caja` FOREIGN KEY (`id_caja`) REFERENCES `core_cajas` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Migrar registros históricos desde ferreteria_cajas (si existe y aún no se migraron)
INSERT INTO `core_cajas` (
  `empresa_id`, `sucursal_id`, `id_usuario`, `origen_modulo`, `ref_legacy_id`,
  `monto_inicial`, `monto_final`, `total_ventas_efectivo`, `total_ingresos`, `total_egresos`,
  `saldo_esperado`, `diferencia`, `fecha_apertura`, `fecha_cierre`, `estado`, `observaciones`,
  `created_at`, `updated_at`
)
SELECT
  COALESCE(f.`empresa_id`, 1),
  f.`sucursal_id`,
  f.`id_usuario`,
  'ferreteria',
  f.`id`,
  f.`monto_inicial`,
  f.`monto_final`,
  COALESCE(f.`total_ventas_efectivo`, 0.00),
  COALESCE(f.`total_ingresos_abonos`, 0.00),
  COALESCE(f.`total_egresos`, 0.00),
  (f.`monto_inicial` + COALESCE(f.`total_ventas_efectivo`, 0) + COALESCE(f.`total_ingresos_abonos`, 0) - COALESCE(f.`total_egresos`, 0)),
  CASE WHEN f.`monto_final` IS NOT NULL
    THEN f.`monto_final` - (f.`monto_inicial` + COALESCE(f.`total_ventas_efectivo`, 0) + COALESCE(f.`total_ingresos_abonos`, 0) - COALESCE(f.`total_egresos`, 0))
    ELSE NULL
  END,
  f.`fecha_apertura`,
  f.`fecha_cierre`,
  f.`estado`,
  f.`observaciones`,
  COALESCE(f.`created_at`, NOW()),
  COALESCE(f.`updated_at`, NOW())
FROM `ferreteria_cajas` f
WHERE NOT EXISTS (
  SELECT 1 FROM `core_cajas` c WHERE c.`origen_modulo` = 'ferreteria' AND c.`ref_legacy_id` = f.`id`
);

-- Migrar movimientos de ferreteria_caja_movimientos
INSERT INTO `core_caja_movimientos` (
  `empresa_id`, `id_caja`, `id_usuario`, `origen_modulo`, `tipo`, `concepto`, `monto`, `fecha`, `created_at`, `updated_at`
)
SELECT
  COALESCE(fm.`empresa_id`, c.`empresa_id`, 1),
  c.`id`,
  fm.`id_usuario`,
  'ferreteria',
  fm.`tipo`,
  fm.`concepto`,
  fm.`monto`,
  fm.`fecha`,
  COALESCE(fm.`created_at`, NOW()),
  COALESCE(fm.`updated_at`, NOW())
FROM `ferreteria_caja_movimientos` fm
INNER JOIN `core_cajas` c ON c.`origen_modulo` = 'ferreteria' AND c.`ref_legacy_id` = fm.`id_caja`
WHERE NOT EXISTS (
  SELECT 1 FROM `core_caja_movimientos` cm
  WHERE cm.`origen_modulo` = 'ferreteria' AND cm.`id_caja` = c.`id` AND cm.`fecha` = fm.`fecha` AND cm.`monto` = fm.`monto`
);

-- 4. Migrar registros históricos desde botica_cajas
INSERT INTO `core_cajas` (
  `empresa_id`, `sucursal_id`, `id_usuario`, `origen_modulo`, `ref_legacy_id`,
  `monto_inicial`, `monto_final`, `total_ventas_efectivo`, `total_ingresos`, `total_egresos`,
  `saldo_esperado`, `diferencia`, `fecha_apertura`, `fecha_cierre`, `estado`, `observaciones`,
  `created_at`, `updated_at`
)
SELECT
  COALESCE(b.`empresa_id`, 1),
  b.`id_sucursal`,
  b.`id_usuario`,
  'botica',
  b.`id`,
  b.`monto_inicial`,
  b.`monto_final`,
  COALESCE(b.`total_ventas`, 0.00),
  COALESCE(b.`total_ingresos`, 0.00),
  COALESCE(b.`total_egresos`, 0.00),
  b.`saldo_esperado`,
  b.`diferencia`,
  b.`fecha_apertura`,
  b.`fecha_cierre`,
  b.`estado`,
  b.`observaciones`,
  COALESCE(b.`created_at`, NOW()),
  COALESCE(b.`updated_at`, NOW())
FROM `botica_cajas` b
WHERE NOT EXISTS (
  SELECT 1 FROM `core_cajas` c WHERE c.`origen_modulo` = 'botica' AND c.`ref_legacy_id` = b.`id`
);

-- Migrar movimientos de botica_caja_movimientos
INSERT INTO `core_caja_movimientos` (
  `empresa_id`, `id_caja`, `id_usuario`, `origen_modulo`, `tipo`, `concepto`, `comprobante`, `monto`, `fecha`, `created_at`, `updated_at`
)
SELECT
  COALESCE(bm.`empresa_id`, c.`empresa_id`, 1),
  c.`id`,
  bm.`id_usuario`,
  'botica',
  bm.`tipo`,
  bm.`motivo`,
  bm.`comprobante`,
  bm.`monto`,
  bm.`fecha`,
  COALESCE(bm.`created_at`, NOW()),
  COALESCE(bm.`updated_at`, NOW())
FROM `botica_caja_movimientos` bm
INNER JOIN `core_cajas` c ON c.`origen_modulo` = 'botica' AND c.`ref_legacy_id` = bm.`id_caja`
WHERE NOT EXISTS (
  SELECT 1 FROM `core_caja_movimientos` cm
  WHERE cm.`origen_modulo` = 'botica' AND cm.`id_caja` = c.`id` AND cm.`fecha` = bm.`fecha` AND cm.`monto` = bm.`monto`
);

-- 5. Migrar registros históricos desde hospedaje_cajas
INSERT INTO `core_cajas` (
  `empresa_id`, `sucursal_id`, `id_usuario`, `origen_modulo`, `ref_legacy_id`,
  `monto_inicial`, `monto_final`, `saldo_esperado`, `diferencia`,
  `fecha_apertura`, `fecha_cierre`, `estado`, `observaciones`,
  `created_at`, `updated_at`
)
SELECT
  COALESCE(h.`empresa_id`, 1),
  h.`sucursal_id`,
  h.`user_id`,
  'hospedaje',
  h.`id`,
  h.`monto_apertura`,
  h.`monto_cierre_real`,
  h.`monto_cierre_sistema`,
  h.`diferencia`,
  h.`fecha_apertura`,
  h.`fecha_cierre`,
  CASE WHEN h.`estado` = 'cerrado' THEN 'Cerrada' ELSE 'Abierta' END,
  h.`observaciones`,
  COALESCE(h.`created_at`, NOW()),
  COALESCE(h.`updated_at`, NOW())
FROM `hospedaje_cajas` h
WHERE NOT EXISTS (
  SELECT 1 FROM `core_cajas` c WHERE c.`origen_modulo` = 'hospedaje' AND c.`ref_legacy_id` = h.`id`
);

-- Migrar movimientos de hospedaje_caja_movimientos
INSERT INTO `core_caja_movimientos` (
  `empresa_id`, `id_caja`, `id_usuario`, `origen_modulo`, `tipo`, `concepto`, `comprobante`, `monto`, `fecha`, `created_at`, `updated_at`
)
SELECT
  COALESCE(hm.`empresa_id`, c.`empresa_id`, 1),
  c.`id`,
  c.`id_usuario`,
  'hospedaje',
  CASE WHEN hm.`tipo` = 'ingreso' THEN 'Ingreso' ELSE 'Egreso' END,
  hm.`motivo`,
  hm.`comprobante`,
  hm.`monto`,
  hm.`fecha`,
  COALESCE(hm.`created_at`, NOW()),
  COALESCE(hm.`updated_at`, NOW())
FROM `hospedaje_caja_movimientos` hm
INNER JOIN `core_cajas` c ON c.`origen_modulo` = 'hospedaje' AND c.`ref_legacy_id` = hm.`turno_id`
WHERE NOT EXISTS (
  SELECT 1 FROM `core_caja_movimientos` cm
  WHERE cm.`origen_modulo` = 'hospedaje' AND cm.`id_caja` = c.`id` AND cm.`fecha` = hm.`fecha` AND cm.`monto` = hm.`monto`
);

SET FOREIGN_KEY_CHECKS = 1;
