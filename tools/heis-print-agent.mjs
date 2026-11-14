// tools/heis-print-agent.mjs
// Micro-Agente Local de Impresión ESC/POS para HEIS Suite (100% Node.js nativo, 0 dependencias)
// Soporta:
//   1) Impresoras de Red / Wi-Fi vía Socket TCP directo al puerto 9100 (ej. printerName: "192.168.1.200:9100")
//   2) Impresoras USB compartidas en Windows (ej. printerName: "POS-80") o CUPS en Linux

import http from 'node:http';
import net from 'node:net';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const PORT = Number(process.env.PRINT_AGENT_PORT || 9101);
const HOST = '127.0.0.1';

/**
 * Envía los bytes ESC/POS directo por Socket TCP (Puerto 9100 JetDirect/RAW)
 * Ideal para impresoras de Cocina (KDS), Barra o Cajas por cable de red LAN.
 */
function enviarPorSocketTcp(ip, port, buffer) {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket();
    socket.setTimeout(5000);

    socket.connect(port, ip, () => {
      socket.write(buffer, (err) => {
        socket.end();
        if (err) return reject(err);
        resolve({ mode: 'TCP_RAW_9100', target: `${ip}:${port}` });
      });
    });

    socket.on('timeout', () => {
      socket.destroy();
      reject(new Error(`Timeout al conectar con la impresora IP ${ip}:${port}`));
    });

    socket.on('error', (err) => {
      socket.destroy();
      reject(new Error(`Error de red hacia impresora ${ip}:${port} -> ${err.message}`));
    });
  });
}

/**
 * Envía los bytes ESC/POS a una impresora USB compartida en el Sistema Operativo
 */
async function enviarPorSpoolerLocal(printerName, buffer) {
  const safeName = String(printerName || 'POS-80').replace(/[^a-zA-Z0-9_\-\s]/g, '');
  const tempFile = path.join(os.tmpdir(), `heis_ticket_${Date.now()}_${Math.random().toString(36).slice(2)}.bin`);

  await fs.writeFile(tempFile, buffer);

  try {
    if (process.platform === 'win32') {
      // Copia binaria directa al recurso compartido SMB local de Windows (\\localhost\POS-80)
      const uncPath = `\\\\localhost\\${safeName}`;
      await execFileAsync('cmd.exe', ['/c', 'copy', '/b', tempFile, uncPath]);
      return { mode: 'WINDOWS_RAW_SPOOLER', target: uncPath };
    } else {
      // Linux / macOS vía CUPS en modo raw
      await execFileAsync('lp', ['-d', safeName, '-o', 'raw', tempFile]);
      return { mode: 'CUPS_RAW', target: safeName };
    }
  } finally {
    await fs.unlink(tempFile).catch(() => {});
  }
}

const server = http.createServer(async (req, res) => {
  const origin = req.headers.origin || '*';

  // Cabeceras CORS + Chrome Private Network Access (PNA) para permitir llamadas desde https://suite.grupoheis.com
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Private-Network', 'true');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200);
    return res.end(JSON.stringify({ ok: true, agent: 'HEIS Node Print Agent v1.0', platform: process.platform }));
  }

  if (req.method !== 'POST') {
    res.writeHead(405);
    return res.end(JSON.stringify({ ok: false, message: 'Método no permitido. Usa POST.' }));
  }

  try {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const body = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');

    // Respuesta inmediata al botón "Probar Ping" de ConfiguracionView.jsx
    if (body.action === 'PING') {
      res.writeHead(200);
      return res.end(
        JSON.stringify({
          ok: true,
          message: 'Agente Node.js HEIS activo y listo.',
          printer: body.printerName || 'POS-80',
        })
      );
    }

    if (!body.rawEscPosBase64) {
      res.writeHead(422);
      return res.end(JSON.stringify({ ok: false, message: 'Falta el campo rawEscPosBase64.' }));
    }

    const rawBuffer = Buffer.from(body.rawEscPosBase64, 'base64');
    const printerTarget = String(body.printerName || 'POS-80').trim();

    let resultado;
    // Si printerName tiene formato IP (ej. "192.168.1.200" o "192.168.1.200:9100"), imprime por red TCP directa
    const ipMatch = printerTarget.match(/^(\d{1,3}(?:\.\d{1,3}){3})(?::(\d+))?$/);
    if (ipMatch) {
      const ip = ipMatch[1];
      const port = Number(ipMatch[2] || 9100);
      resultado = await enviarPorSocketTcp(ip, port, rawBuffer);
    } else {
      resultado = await enviarPorSpoolerLocal(printerTarget, rawBuffer);
    }

    res.writeHead(200);
    return res.end(
      JSON.stringify({
        ok: true,
        bytesSent: rawBuffer.length,
        ...resultado,
      })
    );
  } catch (err) {
    res.writeHead(500);
    return res.end(
      JSON.stringify({
        ok: false,
        message: err.message,
      })
    );
  }
});

server.listen(PORT, HOST, () => {
  console.log(`🖨️  [HEIS Print Agent] Escuchando en http://${HOST}:${PORT}`);
});
