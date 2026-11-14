import sequelize from '../config/db.js';

export async function up() {
  console.log('--- Migración: Módulo Restaurante Avanzado (Salón, Mesas, Canales) ---');
  
  const alterColumns = [
    { table: 'restaurante_ordenes', col: 'discount', sql: 'ALTER TABLE restaurante_ordenes ADD COLUMN discount DECIMAL(10,2) DEFAULT 0.00' },
    { table: 'restaurante_ordenes', col: 'tip', sql: 'ALTER TABLE restaurante_ordenes ADD COLUMN tip DECIMAL(10,2) DEFAULT 0.00' },
    { table: 'restaurante_ordenes', col: 'channel', sql: "ALTER TABLE restaurante_ordenes ADD COLUMN channel VARCHAR(50) DEFAULT 'salon'" },
    { table: 'restaurante_ordenes', col: 'received_amount', sql: 'ALTER TABLE restaurante_ordenes ADD COLUMN received_amount DECIMAL(10,2) DEFAULT 0.00' },
    { table: 'restaurante_ordenes', col: 'change_amount', sql: 'ALTER TABLE restaurante_ordenes ADD COLUMN change_amount DECIMAL(10,2) DEFAULT 0.00' },
    { table: 'restaurante_ordenes', col: 'monto_efectivo', sql: 'ALTER TABLE restaurante_ordenes ADD COLUMN monto_efectivo DECIMAL(10,2) DEFAULT 0.00' },
    { table: 'restaurante_ordenes', col: 'monto_digital', sql: 'ALTER TABLE restaurante_ordenes ADD COLUMN monto_digital DECIMAL(10,2) DEFAULT 0.00' },
    { table: 'restaurante_ordenes', col: 'billetera_digital', sql: 'ALTER TABLE restaurante_ordenes ADD COLUMN billetera_digital VARCHAR(50) NULL' },
    { table: 'restaurante_productos', col: 'price_takeaway', sql: 'ALTER TABLE restaurante_productos ADD COLUMN price_takeaway DECIMAL(10,2) NULL' },
    { table: 'restaurante_productos', col: 'price_delivery', sql: 'ALTER TABLE restaurante_productos ADD COLUMN price_delivery DECIMAL(10,2) NULL' },
    { table: 'restaurante_productos', col: 'recipe_summary', sql: 'ALTER TABLE restaurante_productos ADD COLUMN recipe_summary TEXT NULL' }
  ];

  for (const item of alterColumns) {
    try {
      const [existing] = await sequelize.query(`SHOW COLUMNS FROM ${item.table} LIKE '${item.col}'`);
      if (existing.length === 0) {
        await sequelize.query(item.sql);
        console.log(`✅ Columna agregada: ${item.table}.${item.col}`);
      } else {
        console.log(`ℹ️ Columna ya existente: ${item.table}.${item.col}`);
      }
    } catch (err) {
      console.warn(`⚠️ Error al verificar/agregar ${item.col}:`, err.message);
    }
  }

  console.log('--- Migración de Restaurante completada con éxito ---');
}

export const runMigration = up;
export default { up };

if (process.argv[1] && process.argv[1].includes('migration_restaurante_avanzado')) {
  up()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Error fatal en migración:', err);
      process.exit(1);
    });
}
