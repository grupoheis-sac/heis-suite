import sequelize from '../config/db.js';

export async function up() {
  console.log('--- Migración: Órdenes de Compra Ferretería ---');
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS ferreteria_ordenes_compra (
      id INT AUTO_INCREMENT PRIMARY KEY,
      empresa_id INT NULL,
      sucursal_id INT NULL,
      codigo VARCHAR(50) NOT NULL,
      id_proveedor INT NOT NULL,
      id_usuario INT NOT NULL,
      fecha_emision DATETIME DEFAULT CURRENT_TIMESTAMP,
      fecha_entrega_esperada DATE NULL,
      condicion_pago VARCHAR(50) DEFAULT 'Contado',
      metodo_envio VARCHAR(100) DEFAULT 'Flete Proveedor',
      almacen_destino VARCHAR(255) NULL,
      lugar_entrega VARCHAR(255) NULL,
      observaciones TEXT NULL,
      subtotal DECIMAL(12, 2) DEFAULT 0.00,
      igv DECIMAL(12, 2) DEFAULT 0.00,
      total DECIMAL(12, 2) DEFAULT 0.00,
      estado VARCHAR(50) DEFAULT 'Pendiente',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_empresa (empresa_id),
      INDEX idx_proveedor (id_proveedor),
      INDEX idx_codigo (codigo)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
  console.log('ferreteria_ordenes_compra created/verified');

  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS ferreteria_orden_compra_detalles (
      id INT AUTO_INCREMENT PRIMARY KEY,
      id_orden_compra INT NOT NULL,
      id_producto INT NOT NULL,
      cantidad DECIMAL(12, 3) NOT NULL,
      cantidad_recibida DECIMAL(12, 3) DEFAULT 0.000,
      precio_unitario DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
      subtotal DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_orden (id_orden_compra),
      INDEX idx_producto (id_producto)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
  console.log('ferreteria_orden_compra_detalles created/verified');

  const [colsP] = await sequelize.query('SHOW COLUMNS FROM ferreteria_proveedores').catch(() => [[]]);
  if (colsP && colsP.length > 0) {
    const colNamesP = colsP.map((c) => c.Field);
    const extraColsP = [
      { name: 'tipo_documento', type: "VARCHAR(20) DEFAULT 'RUC'" },
      { name: 'numero_documento', type: 'VARCHAR(20) NULL' },
      { name: 'categoria_rubro', type: "VARCHAR(100) DEFAULT 'Ferretería General'" },
      { name: 'dias_credito', type: 'INT DEFAULT 0' },
      { name: 'limite_credito', type: 'DECIMAL(12,2) DEFAULT 0.00' },
      { name: 'tiempo_entrega_dias', type: 'INT DEFAULT 1' },
      { name: 'agente_percepcion', type: 'TINYINT(1) DEFAULT 0' },
      { name: 'porcentaje_percepcion', type: 'DECIMAL(5,2) DEFAULT 2.00' },
      { name: 'banco', type: 'VARCHAR(100) NULL' },
      { name: 'cuenta_bancaria', type: 'VARCHAR(100) NULL' },
      { name: 'cci', type: 'VARCHAR(100) NULL' },
      { name: 'estado_sunat', type: "VARCHAR(50) DEFAULT 'ACTIVO'" },
      { name: 'condicion_sunat', type: "VARCHAR(50) DEFAULT 'HABIDO'" },
      { name: 'ubigeo', type: 'VARCHAR(20) NULL' },
    ];
    for (const c of extraColsP) {
      if (!colNamesP.includes(c.name)) {
        await sequelize.query(`ALTER TABLE ferreteria_proveedores ADD COLUMN ${c.name} ${c.type};`);
        console.log('Added col to ferreteria_proveedores:', c.name);
      }
    }

    await sequelize.query(
      "UPDATE ferreteria_proveedores SET numero_documento = ruc WHERE numero_documento IS NULL OR numero_documento = ''"
    ).catch(() => {});
  }

  const [colsC] = await sequelize.query('SHOW COLUMNS FROM ferreteria_compras').catch(() => [[]]);
  if (colsC && colsC.length > 0) {
    const colNamesC = colsC.map((c) => c.Field);
    if (!colNamesC.includes('id_orden_compra')) {
      await sequelize.query('ALTER TABLE ferreteria_compras ADD COLUMN id_orden_compra INT NULL;');
      console.log('Added id_orden_compra to ferreteria_compras');
    }
    if (!colNamesC.includes('guia_remision')) {
      await sequelize.query('ALTER TABLE ferreteria_compras ADD COLUMN guia_remision VARCHAR(50) NULL;');
      console.log('Added guia_remision to ferreteria_compras');
    }
    if (!colNamesC.includes('observaciones')) {
      await sequelize.query('ALTER TABLE ferreteria_compras ADD COLUMN observaciones TEXT NULL;');
      console.log('Added observaciones to ferreteria_compras');
    }
  }

  console.log('Migration completed successfully!');
}

export const migrate = up;
export default { up };

if (process.argv[1] && process.argv[1].includes('migration_ordenes_compra')) {
  up()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}
