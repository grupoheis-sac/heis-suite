import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { verifyJWT } from './core/middleware/auth.middleware.js';
import { tenantContext } from './core/middleware/empresa.middleware.js';
import { requireModulo } from './core/middleware/modulo-guard.middleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function loadModules(app) {
  const modulesDir = path.join(__dirname, 'modules');

  if (!fs.existsSync(modulesDir)) {
    console.log('ℹ️  No hay carpeta de módulos verticales.');
    return;
  }

  const entries = fs.readdirSync(modulesDir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const moduleName = entry.name;
      const routesFile = path.join(modulesDir, moduleName, 'routes', 'index.js');

      if (fs.existsSync(routesFile)) {
        try {
          const moduleURL = pathToFileURL(routesFile).href;
          const { default: moduleRouter } = await import(moduleURL);

          // Registrar módulo con protecciones automáticas
          app.use(
            `/api/${moduleName}`,
            verifyJWT,
            tenantContext,
            requireModulo(moduleName),
            moduleRouter
          );

          console.log(`🔌 Módulo vertical activo: [${moduleName.toUpperCase()}] montado en /api/${moduleName}`);
        } catch (error) {
          console.error(`❌ Error cargando módulo [${moduleName}]:`, error);
        }
      }
    }
  }
}

