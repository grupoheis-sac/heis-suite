import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOCK_NAME = 'heis_suite_schema_migration_lock';

/**
 * Helpers idempotentes para que las migraciones JS no fallen si una columna o índice ya existe
 */
export const createSafeMigrationHelpers = (queryInterface, transaction) => ({
  async safeAddColumn(tableName, columnName, definition) {
    try {
      const tableDesc = await queryInterface.describeTable(tableName, { transaction });
      if (!tableDesc[columnName]) {
        await queryInterface.addColumn(tableName, columnName, definition, { transaction });
        console.log(`  + safeAddColumn: ${tableName}.${columnName}`);
      }
    } catch (err) {
      console.warn(`  ! safeAddColumn fallo en ${tableName}.${columnName}:`, err.message);
    }
  },
  async safeRemoveColumn(tableName, columnName) {
    try {
      const tableDesc = await queryInterface.describeTable(tableName, { transaction });
      if (tableDesc[columnName]) {
        await queryInterface.removeColumn(tableName, columnName, { transaction });
        console.log(`  - safeRemoveColumn: ${tableName}.${columnName}`);
      }
    } catch (err) {
      console.warn(`  ! safeRemoveColumn fallo en ${tableName}.${columnName}:`, err.message);
    }
  },
  async safeAddIndex(tableName, attributes, options = {}) {
    try {
      const indexes = await queryInterface.showIndex(tableName, { transaction });
      const exists = indexes.some((idx) => idx.name === options.name);
      if (!exists) {
        await queryInterface.addIndex(tableName, attributes, { ...options, transaction });
        console.log(`  + safeAddIndex: ${tableName} (${options.name || attributes.join(',')})`);
      }
    } catch (err) {
      console.warn(`  ! safeAddIndex fallo en ${tableName}:`, err.message);
    }
  },
});

async function ensureMetaTable() {
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS \`SequelizeMeta\` (
      \`name\` VARCHAR(255) NOT NULL PRIMARY KEY,
      \`checksum\` VARCHAR(64) NOT NULL,
      \`executed_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
}

async function acquireAdvisoryLock() {
  try {
    const [[result]] = await sequelize.query(`SELECT GET_LOCK('${LOCK_NAME}', 30) AS locked;`);
    if (Number(result?.locked) !== 1) {
      console.warn('[MIGRATOR] Advertencia: No se pudo obtener el lock de migración GET_LOCK en MySQL tras 30s. Continuando...');
    }
  } catch (e) {
    console.warn('[MIGRATOR] GET_LOCK no disponible o omitido:', e.message);
  }
}

async function releaseAdvisoryLock() {
  await sequelize.query(`SELECT RELEASE_LOCK('${LOCK_NAME}');`).catch(() => {});
}

async function getExecutedMigrations() {
  try {
    const [rows] = await sequelize.query(
      'SELECT `name`, `checksum`, `executed_at` FROM `SequelizeMeta` ORDER BY `name` ASC;'
    );
    return new Map(rows.map((r) => [r.name, r]));
  } catch (err) {
    return new Map();
  }
}

async function discoverMigrationFiles() {
  const entries = await fs.readdir(__dirname);
  return entries
    .filter(
      (file) =>
        file !== 'migrator.js' &&
        (file.endsWith('.js') || file.endsWith('.sql'))
    )
    .sort((a, b) => a.localeCompare(b));
}

async function computeFileChecksum(filePath) {
  const content = await fs.readFile(filePath, 'utf8');
  return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Ejecuta un archivo .sql dividiendo sentencias de forma segura
 */
async function executeSqlFile(filePath, transaction) {
  const rawSql = await fs.readFile(filePath, 'utf8');
  const statements = rawSql
    .split(/;\s*$/m)
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith('--'));

  for (const statement of statements) {
    try {
      await sequelize.query(statement, { transaction });
    } catch (sqlErr) {
      // Ignorar errores benignos de tablas o columnas que ya existen
      if (!sqlErr.message.includes('already exists') && !sqlErr.message.includes('Duplicate column')) {
        throw sqlErr;
      }
    }
  }
}

/**
 * Ejecuta todas las migraciones pendientes en orden determinista
 */
export async function runPendingMigrations() {
  await ensureMetaTable();
  await acquireAdvisoryLock();

  try {
    const executedMap = await getExecutedMigrations();
    const files = await discoverMigrationFiles();
    const queryInterface = sequelize.getQueryInterface();

    for (const file of files) {
      const fullPath = path.join(__dirname, file);
      const checksum = await computeFileChecksum(fullPath);

      if (executedMap.has(file)) {
        continue;
      }

      console.log(`[MIGRATOR] Ejecutando migración: ${file}...`);

      await sequelize.transaction(async (t) => {
        if (file.endsWith('.sql')) {
          await executeSqlFile(fullPath, t);
        } else {
          const moduleUrl = pathToFileURL(fullPath).href;
          const migrationModule = await import(moduleUrl);
          const upFn =
            migrationModule.up ||
            migrationModule.default?.up ||
            migrationModule.ejecutarMigracionUnificarCajas ||
            migrationModule.migrate ||
            migrationModule.runMigration ||
            migrationModule.default;

          if (typeof upFn === 'function') {
            const helpers = createSafeMigrationHelpers(queryInterface, t);
            await upFn({ queryInterface, Sequelize: DataTypes, transaction: t, helpers });
          } else {
            console.warn(`[MIGRATOR] Aviso: ${file} no exporta una función 'up', se marca como registrada.`);
          }
        }

        await sequelize.query(
          'INSERT INTO `SequelizeMeta` (`name`, `checksum`, `executed_at`) VALUES (?, ?, NOW());',
          { replacements: [file, checksum], transaction: t }
        );
      });

      console.log(`[MIGRATOR] Completada exitosamente: ${file}`);
    }
  } finally {
    await releaseAdvisoryLock();
  }
}

/**
 * Revierte la última migración ejecutada (Rollback)
 */
export async function rollbackLastMigration() {
  await ensureMetaTable();
  await acquireAdvisoryLock();

  try {
    const [rows] = await sequelize.query(
      'SELECT `name` FROM `SequelizeMeta` ORDER BY `executed_at` DESC, `name` DESC LIMIT 1;'
    );

    if (rows.length === 0) {
      console.log('[MIGRATOR] No existen migraciones aplicadas para revertir.');
      return;
    }

    const lastFile = rows[0].name;
    const fullPath = path.join(__dirname, lastFile);
    const queryInterface = sequelize.getQueryInterface();

    await sequelize.transaction(async (t) => {
      if (lastFile.endsWith('.js')) {
        const moduleUrl = pathToFileURL(fullPath).href;
        const migrationModule = await import(moduleUrl);
        const downFn = migrationModule.down || migrationModule.default?.down;

        if (typeof downFn !== 'function') {
          throw new Error(`La migración ${lastFile} no define una función 'down' para rollback.`);
        }

        const helpers = createSafeMigrationHelpers(queryInterface, t);
        await downFn({ queryInterface, Sequelize: DataTypes, transaction: t, helpers });
      } else {
        throw new Error(`La migración SQL ${lastFile} requiere reversión mediante migración JS con método 'down'.`);
      }

      await sequelize.query('DELETE FROM `SequelizeMeta` WHERE `name` = ?;', {
        replacements: [lastFile],
        transaction: t,
      });
    });

    console.log(`[MIGRATOR] Rollback completado para: ${lastFile}`);
  } finally {
    await releaseAdvisoryLock();
  }
}

// Permite ejecución directa por CLI: node src/migrations/migrator.js [up|down|status]
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename)) {
  const cmd = process.argv[2] || 'up';
  (async () => {
    try {
      if (cmd === 'up') await runPendingMigrations();
      else if (cmd === 'down') await rollbackLastMigration();
      else if (cmd === 'status') {
        await ensureMetaTable();
        const executed = await getExecutedMigrations();
        const files = await discoverMigrationFiles();
        console.table(
          files.map((f) => ({
            migration: f,
            status: executed.has(f) ? 'APPLIED' : 'PENDING',
            executed_at: executed.get(f)?.executed_at || null,
          }))
        );
      }
      process.exit(0);
    } catch (err) {
      console.error('[MIGRATOR_FATAL]:', err);
      process.exit(1);
    }
  })();
}

export default {
  runPendingMigrations,
  rollbackLastMigration,
};
