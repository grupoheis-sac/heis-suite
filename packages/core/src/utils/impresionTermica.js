// packages/core/src/utils/impresionTermica.js

export const PAPER_PROFILES = {
  '58mm': {
    widthMm: 58,
    columns: 32,
    dotsWidth: 384,
    cssWidth: '58mm',
    fontSizePx: 11,
  },
  '80mm': {
    widthMm: 80,
    columns: 48,
    dotsWidth: 576,
    cssWidth: '80mm',
    fontSizePx: 12,
  },
};

/**
 * Escapa caracteres HTML para tickets de impresión
 */
export function escapeHtml(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
export const escHtml = escapeHtml;

/**
 * Construye la cadena estándar de Código QR exigida por SUNAT UBL 2.1
 * Formato: RUC|TIPO_CPE|SERIE|NUMERO|MTO_IGV|MTO_TOTAL|FECHA_EMISION|TIPO_DOC_RECEPTOR|NUM_DOC_RECEPTOR|DIGEST_VALUE|
 */
export function buildSunatQrPayload(ticket) {
  if (ticket?.qr_cadena) return ticket.qr_cadena;
  if (ticket?.sunat_qr) return ticket.sunat_qr;
  const ruc = ticket?.empresa?.ruc || ticket?.ruc || '00000000000';
  const tipoCpe = ticket?.tipo_comprobante === 'Factura' ? '01' : (ticket?.tipo_comprobante === 'NotaCredito' ? '07' : '03');
  const serie = ticket?.serie || 'B001';
  const correlativo = String(ticket?.correlativo || ticket?.numero || '1').padStart(8, '0');
  const igv = Number(ticket?.igv ?? (Number(ticket?.total || 0) * 0.18) / 1.18).toFixed(2);
  const total = Number(ticket?.total || 0).toFixed(2);
  const fecha = (ticket?.fecha_emision || ticket?.created_at || new Date().toISOString()).slice(0, 10);
  const tipoDocCliente = ticket?.cliente?.tipo_documento || (tipoCpe === '01' ? '6' : '1');
  const numDocCliente = ticket?.cliente?.documento || ticket?.cliente?.numero_documento || '00000000';
  const hash = ticket?.hash_cpe || ticket?.sunat_hash || '';

  return `${ruc}|${tipoCpe}|${serie}|${correlativo}|${igv}|${total}|${fecha}|${tipoDocCliente}|${numDocCliente}|${hash}|`;
}

/**
 * Codificador Binario ESC/POS Nativo (sin dependencias externas)
 */
export class EscPosBuilder {
  constructor(format = '80mm') {
    this.profile = PAPER_PROFILES[format] || PAPER_PROFILES['80mm'];
    this.buffer = [];
    this.encoder = new TextEncoder();
  }

  raw(bytes) {
    for (const b of bytes) this.buffer.push(b & 0xff);
    return this;
  }

  init() {
    return this.raw([0x1b, 0x40, 0x1b, 0x74, 0x02]);
  }

  align(mode = 'left') {
    const map = { left: 0x00, center: 0x01, right: 0x02 };
    return this.raw([0x1b, 0x61, map[mode] ?? 0x00]);
  }

  bold(active = true) {
    return this.raw([0x1b, 0x45, active ? 0x01 : 0x00]);
  }

  doubleSize(active = true) {
    return this.raw([0x1d, 0x21, active ? 0x11 : 0x00]);
  }

  text(str = '') {
    const clean = String(str)
      .replace(/[áä]/g, 'a')
      .replace(/[éë]/g, 'e')
      .replace(/[íï]/g, 'i')
      .replace(/[óö]/g, 'o')
      .replace(/[úü]/g, 'u')
      .replace(/[ÁÄ]/g, 'A')
      .replace(/[ÉË]/g, 'E')
      .replace(/[ÍÏ]/g, 'I')
      .replace(/[ÓÖ]/g, 'O')
      .replace(/[ÚÜ]/g, 'U')
      .replace(/ñ/g, 'n')
      .replace(/Ñ/g, 'N');
    const bytes = this.encoder.encode(clean);
    return this.raw(bytes);
  }

  line(str = '') {
    return this.text(str).raw([0x0a]);
  }

  divider(char = '-') {
    return this.line(char.repeat(this.profile.columns));
  }

  pair(leftText, rightText) {
    const cols = this.profile.columns;
    const right = String(rightText);
    const maxLeft = Math.max(1, cols - right.length - 1);
    const left = String(leftText).slice(0, maxLeft);
    const spaces = ' '.repeat(Math.max(1, cols - left.length - right.length));
    return this.line(`${left}${spaces}${right}`);
  }

  itemRow(cantidad, descripcion, precioUnitario, subtotal) {
    const cols = this.profile.columns;
    const subStr = Number(subtotal).toFixed(2);
    const prefix = `${cantidad}x `;
    const maxDescLen = cols - prefix.length - subStr.length - 1;
    const descCortada = String(descripcion).slice(0, Math.max(8, maxDescLen));
    const spaces = ' '.repeat(
      Math.max(1, cols - prefix.length - descCortada.length - subStr.length)
    );
    this.line(`${prefix}${descCortada}${spaces}${subStr}`);

    if (cols === 32 && Number(cantidad) > 1) {
      this.line(`   (P.U. S/ ${Number(precioUnitario).toFixed(2)})`);
    }
    return this;
  }

  qrNative(dataString, moduleSize = 5) {
    const dataBytes = this.encoder.encode(dataString);
    const storeLen = dataBytes.length + 3;
    const pL = storeLen & 0xff;
    const pH = (storeLen >> 8) & 0xff;

    this.align('center');
    this.raw([0x1d, 0x28, 0x6b, 0x04, 0x00, 0x31, 0x41, 0x32, 0x00]);
    this.raw([0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x43, moduleSize]);
    this.raw([0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x45, 0x31]);
    this.raw([0x1d, 0x28, 0x6b, pL, pH, 0x31, 0x50, 0x30]);
    this.raw(dataBytes);
    this.raw([0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x51, 0x30]);
    this.raw([0x0a]);
    return this.align('left');
  }

  openCashDrawer() {
    return this.raw([0x1b, 0x70, 0x00, 0x19, 0xfa]);
  }

  feedAndCut(lines = 4) {
    this.raw(new Array(lines).fill(0x0a));
    return this.raw([0x1d, 0x56, 0x42, 0x00]);
  }

  toUint8Array() {
    return new Uint8Array(this.buffer);
  }

  toBase64() {
    let binary = '';
    const bytes = this.toUint8Array();
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return typeof window !== 'undefined' ? window.btoa(binary) : Buffer.from(bytes).toString('base64');
  }
}

export function compilarTicketEscPos(ticket, options = {}) {
  const format = options.formato || ticket.formato || '80mm';
  const abrirGaveta = Boolean(options.abrirGaveta ?? ticket.abrirGaveta);
  const b = new EscPosBuilder(format);

  const empresa = ticket.empresa || {};
  const cliente = ticket.cliente || {};
  const items = Array.isArray(ticket.items) ? ticket.items : Array.isArray(ticket.detalles) ? ticket.detalles : [];
  const total = Number(ticket.total || 0);
  const gravada = Number(ticket.op_gravadas ?? total / 1.18);
  const igv = Number(ticket.igv ?? total - gravada);

  b.init();
  if (abrirGaveta) b.openCashDrawer();

  b.align('center')
    .bold(true)
    .doubleSize(true)
    .line(empresa.nombre_comercial || empresa.nombre || empresa.razon_social || 'HEIS SUITE')
    .doubleSize(false)
    .line(`RUC: ${empresa.ruc || '00000000000'}`)
    .bold(false);

  if (empresa.direccion) b.line(empresa.direccion);
  if (empresa.telefono) b.line(`Tel: ${empresa.telefono}`);
  b.divider('=');

  b.align('center')
    .bold(true)
    .line(ticket.titulo_comprobante || 'BOLETA DE VENTA ELECTRONICA')
    .line(`${ticket.serie || 'B001'}-${String(ticket.correlativo || ticket.numero || '1').padStart(8, '0')}`)
    .bold(false)
    .divider('-');

  b.align('left');
  b.line(`Fecha : ${ticket.fecha_emision || new Date().toLocaleString('es-PE')}`);
  b.line(`Cliente: ${cliente.nombre || cliente.razon_social || 'CLIENTE VARIOS'}`);
  if (cliente.documento || cliente.numero_documento) b.line(`Doc.  : ${cliente.documento || cliente.numero_documento}`);
  if (ticket.meta?.habitacion) b.line(`Habit.: ${ticket.meta.habitacion}`);
  if (ticket.meta?.mesa) b.line(`Mesa  : ${ticket.meta.mesa} | Mozo: ${ticket.meta.mozo || '-'}`);
  b.divider('-');

  b.bold(true).pair('CANT x DESCRIPCION', 'IMPORTE').bold(false).divider('-');

  for (const item of items) {
    const cant = Number(item.cantidad || 1);
    const pu = Number(item.precio_unitario || item.precio || 0);
    const sub = Number(item.subtotal ?? cant * pu);
    b.itemRow(cant, item.nombre || item.descripcion || item.producto?.nombre, pu, sub);
  }

  b.divider('-');
  b.pair('OP. GRAVADA S/', gravada.toFixed(2));
  b.pair('I.G.V. (18%) S/', igv.toFixed(2));
  b.bold(true).pair('IMPORTE TOTAL S/', total.toFixed(2)).bold(false);

  if (ticket.monto_letras) b.line(`SON: ${ticket.monto_letras}`);
  b.pair('MEDIO DE PAGO:', ticket.metodo_pago || 'EFECTIVO');
  b.divider('-');

  const qrPayload = buildSunatQrPayload(ticket);
  b.qrNative(qrPayload, format === '58mm' ? 4 : 5);

  b.align('center');
  if (ticket.hash_cpe || ticket.sunat_hash) b.line(`Resumen: ${ticket.hash_cpe || ticket.sunat_hash}`);
  b.line('Representacion impresa del Comprobante');
  b.line('de Venta Electronica. Consulte en SUNAT.');
  b.feedAndCut(4);

  return b;
}

async function imprimirViaBridgeLocal(escPosBuilder, ticket, configBridge) {
  const endpoint =
    configBridge.bridgeUrl ||
    (typeof localStorage !== 'undefined' ? localStorage.getItem('heis_print_bridge_url') : null) ||
    'http://127.0.0.1/SERVER_PRINTPOS/PrintDoc.php';

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    targetAddressSpace: 'local',
    body: JSON.stringify({
      printerName: configBridge.printerName || (typeof localStorage !== 'undefined' ? localStorage.getItem('heis_printer_name') : null) || 'POS-80',
      formato: configBridge.formato || '80mm',
      rawEscPosBase64: escPosBuilder.toBase64(),
      ticketData: ticket,
    }),
  });

  if (!response.ok) {
    throw new Error(`El servidor de impresión local respondió con HTTP ${response.status}`);
  }
  return { ok: true, mode: 'BRIDGE_LOCAL' };
}

async function imprimirViaWebSerial(escPosBuilder) {
  if (typeof navigator === 'undefined' || !('serial' in navigator)) {
    throw new Error('WebSerial no está disponible en este navegador.');
  }
  const ports = await navigator.serial.getPorts();
  const port = ports[0] || (await navigator.serial.requestPort());
  if (!port.readable) {
    await port.open({ baudRate: 9600 });
  }
  const writer = port.writable.getWriter();
  try {
    await writer.write(escPosBuilder.toUint8Array());
  } finally {
    writer.releaseLock();
  }
  return { ok: true, mode: 'WEB_SERIAL' };
}


export function generarHtmlTicketCierreCaja(cajaInfo, formato = '80mm', settings = {}) {
  const nombreFerreteria = escapeHtml(settings.businessName || 'FERRETERÍA & MATERIALES PRO');
  const rucFerreteria = escapeHtml(settings.businessRuc || '20609123456');
  const direccionFerreteria = escapeHtml(settings.address || 'Av. Industrial 840, Ate Vitarte, Lima - Perú');
  const telefonoFerreteria = escapeHtml(settings.phone || '(01) 489-3210 / 998-765-432');

  const es58mm = formato === '58mm';
  const anchoMm = es58mm ? '58mm' : '80mm';
  const anchoPx = es58mm ? '210px' : '288px';

  const mInicial = parseFloat(cajaInfo?.monto_inicial || 0);
  const vEfectivo = parseFloat(cajaInfo?.ventas_efectivo ?? cajaInfo?.total_ventas_efectivo ?? 0);
  const vDigital = parseFloat(cajaInfo?.ventas_digitales ?? 0);
  const tVentas = parseFloat(cajaInfo?.total_ventas ?? cajaInfo?.total_ventas_general ?? (vEfectivo + vDigital));
  const cantVentas = cajaInfo?.cantidad_ventas ?? 0;
  const abonos = parseFloat(cajaInfo?.abonos_efectivo ?? cajaInfo?.total_ingresos_abonos ?? 0);
  const ingExtra = parseFloat(cajaInfo?.ingresos_extra ?? 0);
  const egresos = parseFloat(cajaInfo?.total_egresos ?? cajaInfo?.egresos ?? 0);
  const sEsperado = parseFloat(cajaInfo?.monto_final_esperado ?? cajaInfo?.saldo_esperado_efectivo ?? (mInicial + vEfectivo + abonos + ingExtra - egresos));
  const sReal = parseFloat(cajaInfo?.monto_final_real ?? cajaInfo?.monto_final ?? cajaInfo?.saldo_esperado_efectivo ?? 0);
  const dif = parseFloat(cajaInfo?.diferencia !== undefined ? cajaInfo.diferencia : (cajaInfo?.estado === 'Abierta' ? 0 : (sReal - sEsperado)));

  const fechaAperturaFmt = cajaInfo?.fecha_apertura
    ? new Date(cajaInfo.fecha_apertura).toLocaleString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '-';
  const fechaCierreFmt = cajaInfo?.fecha_cierre
    ? new Date(cajaInfo.fecha_cierre).toLocaleString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : (cajaInfo?.estado === 'Abierta' ? 'En curso (Abierta)' : '-');
  const fechaEmisionFmt = new Date().toLocaleString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const textoCuadre = cajaInfo?.estado === 'Abierta'
    ? 'ARQUEO EN VIVO — TURNO EN CURSO'
    : Math.abs(dif) < 0.05
    ? 'CUADRADO PERFECTO (OK)'
    : dif > 0
    ? `SOBRANTE DE CAJA: +S/ ${dif.toFixed(2)}`
    : `FALTANTE DE CAJA: -S/ ${Math.abs(dif).toFixed(2)}`;

  const movimientos = Array.isArray(cajaInfo?.movimientos) ? cajaInfo.movimientos : [];

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8"/>
      <title>Corte de Caja #${cajaInfo?.id || 'Turno'} - ${nombreFerreteria}</title>
      <style>
        @page {
          size: ${anchoMm} auto;
          margin: 0;
        }
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        body {
          font-family: 'Courier New', Courier, monospace, monospace;
          width: ${anchoPx};
          max-width: ${anchoPx};
          margin: 0 auto;
          padding: 8px 6px;
          background: #fff;
          color: #000;
          font-size: ${es58mm ? '9px' : '10.5px'};
          line-height: 1.25;
        }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .font-bold { font-weight: 700; }
        .font-black { font-weight: 900; }
        .uppercase { text-transform: uppercase; }
        .border-b-dashed { border-bottom: 1px dashed #000; padding-bottom: 4px; margin-bottom: 4px; }
        .row-between { display: flex; justify-content: space-between; align-items: baseline; }
        .truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .no-print { display: block; }
        @media screen {
          body {
            margin: 20px auto;
            box-shadow: 0 4px 20px rgba(0,0,0,0.15);
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 14px 10px;
          }
          .barra-control-print {
            background: #1e1b4b;
            color: #fff;
            padding: 10px 14px;
            margin: -14px -10px 14px -10px;
            border-radius: 8px 8px 0 0;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-family: sans-serif;
          }
          .barra-btn-print {
            background: #4f46e5;
            color: #fff;
            font-weight: 800;
            font-size: 12px;
            padding: 8px 16px;
            border-radius: 8px;
            border: none;
            cursor: pointer;
            box-shadow: 0 2px 6px rgba(79, 70, 229, 0.3);
          }
          .barra-btn-close {
            background: #334155;
            color: #cbd5e1;
            font-weight: 700;
            font-size: 12px;
            padding: 8px 14px;
            border-radius: 8px;
            border: none;
            cursor: pointer;
            margin-left: 6px;
          }
        }
        @media print {
          .no-print { display: none !important; }
          body { margin: 0 !important; padding: 0 !important; box-shadow: none !important; border: none !important; border-radius: 0 !important; }
        }
      </style>
    </head>
    <body>
      <div class="no-print barra-control-print">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-weight: 900; font-size: 13px;">🛠️ CORTE DE CAJA</span>
          <span style="background: #4f46e5; color: #fff; font-size: 10px; font-weight: 900; padding: 2px 7px; border-radius: 6px;">${formato}</span>
          <span style="color: #94a3b8; font-size: 11px;">TURNO #${cajaInfo?.id || 'ACTUAL'}</span>
        </div>
        <div>
          <button type="button" onclick="window.print()" class="barra-btn-print">🖨️ IMPRIMIR</button>
          <button type="button" onclick="window.close()" class="barra-btn-close">Cerrar</button>
        </div>
      </div>

      <!-- Cabecera Ferretería -->
      <div class="text-center border-b-dashed">
        <div class="font-black uppercase" style="font-size: ${es58mm ? '11px' : '13px'};">${nombreFerreteria}</div>
        <div class="font-bold">R.U.C. N° ${rucFerreteria}</div>
        <div style="font-size: ${es58mm ? '8px' : '9.5px'};">${direccionFerreteria}</div>
        <div style="font-size: ${es58mm ? '8px' : '9.5px'};">Telf: ${telefonoFerreteria}</div>
      </div>

      <!-- Identificación de Cierre y Turno -->
      <div class="border-b-dashed" style="font-size: ${es58mm ? '8.5px' : '10px'};">
        <div class="text-center font-black uppercase" style="font-size: ${es58mm ? '10px' : '11.5px'}; margin-bottom: 2px;">
          *** CORTE Y ARQUEO DE CAJA ***
        </div>
        <div class="text-center font-bold" style="margin-bottom: 3px;">
          TURNO N°: #${cajaInfo?.id || '001'}
        </div>
        <div class="row-between">
          <span>APERTURA:</span>
          <span class="font-bold">${fechaAperturaFmt}</span>
        </div>
        <div class="row-between">
          <span>CIERRE:</span>
          <span class="font-bold">${fechaCierreFmt}</span>
        </div>
        <div class="row-between">
          <span>CAJERO:</span>
          <span class="font-bold truncate" style="max-width: ${es58mm ? '110px' : '160px'};">
            ${cajaInfo?.usuario?.nombre || 'Usuario Responsable'}
          </span>
        </div>
      </div>

      <!-- Cuadre Operativo -->
      <div class="border-b-dashed" style="font-size: ${es58mm ? '8.5px' : '10px'};">
        <div class="font-black text-center uppercase" style="margin-bottom: 3px;">-- CUADRE OPERATIVO --</div>
        <div class="row-between">
          <span>(+) FONDO INICIAL:</span>
          <span class="font-bold">S/ ${mInicial.toFixed(2)}</span>
        </div>
        <div class="row-between">
          <span>(+) VENTAS EFECTIVO:</span>
          <span class="font-bold">S/ ${vEfectivo.toFixed(2)}</span>
        </div>
        ${cantVentas > 0 ? `
          <div class="row-between" style="font-size: ${es58mm ? '7.5px' : '8.5px'}; color: #444;">
            <span>  └ Transacciones:</span>
            <span>${cantVentas} ventas</span>
          </div>
        ` : ''}
        <div class="row-between">
          <span>(+) VENTAS DIGITALES:</span>
          <span class="font-bold">S/ ${vDigital.toFixed(2)}</span>
        </div>
        ${abonos > 0 ? `
          <div class="row-between">
            <span>(+) ABONOS COBRADOS:</span>
            <span class="font-bold">S/ ${abonos.toFixed(2)}</span>
          </div>
        ` : ''}
        ${ingExtra > 0 ? `
          <div class="row-between">
            <span>(+) INGRESOS EXTRA:</span>
            <span class="font-bold">S/ ${ingExtra.toFixed(2)}</span>
          </div>
        ` : ''}
        ${egresos > 0 ? `
          <div class="row-between">
            <span>(-) GASTOS / EGRESOS:</span>
            <span class="font-bold">S/ ${egresos.toFixed(2)}</span>
          </div>
        ` : ''}
        <div class="row-between font-bold" style="border-top: 1px dotted #888; margin-top: 3px; padding-top: 2px;">
          <span>TOTAL VENTAS TURNO:</span>
          <span>S/ ${tVentas.toFixed(2)}</span>
        </div>
      </div>

      <!-- Balance Físico y Diferencia -->
      <div class="border-b-dashed" style="font-size: ${es58mm ? '9px' : '10.5px'};">
        <div class="row-between">
          <span>SALDO ESPERADO CAJÓN:</span>
          <span class="font-bold">S/ ${sEsperado.toFixed(2)}</span>
        </div>
        <div class="row-between font-black" style="font-size: ${es58mm ? '10px' : '11.5px'};">
          <span>SALDO FÍSICO CONTADO:</span>
          <span>S/ ${sReal.toFixed(2)}</span>
        </div>
        <div class="row-between font-black" style="margin-top: 3px; border-top: 1px dashed #000; padding-top: 3px;">
          <span>DIFERENCIA:</span>
          <span>${dif > 0 ? '+' : ''}S/ ${dif.toFixed(2)}</span>
        </div>
        <div class="text-center font-black" style="margin-top: 3px; font-size: ${es58mm ? '8.5px' : '10px'}; border: 1px solid #000; padding: 2px 4px;">
          ${textoCuadre}
        </div>
      </div>

      <!-- Movimientos de Caja si existen -->
      ${movimientos.length > 0 ? `
        <div class="border-b-dashed" style="font-size: ${es58mm ? '8px' : '9px'};">
          <div class="font-black uppercase" style="margin-bottom: 2px;">MOVIMIENTOS (${movimientos.length}):</div>
          ${movimientos.map(m => `
            <div class="row-between">
              <span class="truncate" style="max-width: ${es58mm ? '100px' : '150px'};">
                ${m.tipo === 'Ingreso' ? '[+ING]' : '[-EGR]'} ${m.concepto || 'Movimiento'}
              </span>
              <span class="font-bold">S/ ${parseFloat(m.monto || 0).toFixed(2)}</span>
            </div>
          `).join('')}
        </div>
      ` : ''}

      <!-- Firmas -->
      <div style="font-size: ${es58mm ? '7.5px' : '8.5px'}; margin-top: 16px; display: flex; justify-content: space-between; gap: 8px;">
        <div style="flex: 1; text-align: center;">
          <div style="border-top: 1px solid #000; margin-bottom: 2px;"></div>
          <span>ENTREGUÉ CONFORME</span><br/>
          <span class="font-bold">${cajaInfo?.usuario?.nombre || 'CAJERO'}</span>
        </div>
        <div style="flex: 1; text-align: center;">
          <div style="border-top: 1px solid #000; margin-bottom: 2px;"></div>
          <span>RECIBÍ CONFORME</span><br/>
          <span class="font-bold">ADMINISTRACIÓN</span>
        </div>
      </div>

      <div class="text-center" style="font-size: ${es58mm ? '7px' : '8px'}; color: #555; margin-top: 8px;">
        <div>Emisión: ${fechaEmisionFmt}</div>
        <div>Control Interno de Gestión Ferretera</div>
        <div class="font-bold" style="margin-top: 2px;">*** FIN DE REPORTE ***</div>
      </div>
    </body>
    </html>
  `;
}

export function imprimirTicketCierreCaja(cajaInfo, { formato = '80mm', settings = {}, autoPrint = true } = {}) {
  const htmlContent = generarHtmlTicketCierreCaja(cajaInfo, formato, settings);

  try {
    const anchoWin = formato === '58mm' ? 340 : 420;
    const printWindow = window.open(
      '',
      '_blank',
      `width=${anchoWin},height=700,left=180,top=60,scrollbars=yes,menubar=no,toolbar=no,location=no,status=no`
    );

    if (printWindow && !printWindow.closed) {
      printWindow.document.open();
      printWindow.document.write(htmlContent);
      printWindow.document.close();

      if (autoPrint) {
        const dispararImpresion = () => {
          try {
            printWindow.focus();
            printWindow.print();
          } catch (err) {
            console.warn('Error en printWindow.print():', err);
          }
        };

        if (printWindow.document.readyState === 'complete') {
          setTimeout(dispararImpresion, 300);
        } else {
          printWindow.onload = () => setTimeout(dispararImpresion, 300);
          setTimeout(dispararImpresion, 600);
        }
      } else {
        printWindow.focus();
      }
      return;
    }
  } catch (popupErr) {
    console.warn('Popup bloqueado, usando iframe:', popupErr);
  }

  // Fallback iframe
  try {
    let iframe = document.getElementById('print-cierre-engine-iframe');
    const anchoIframe = formato === '58mm' ? '58mm' : '80mm';

    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = 'print-cierre-engine-iframe';
      iframe.style.position = 'fixed';
      iframe.style.left = '0';
      iframe.style.top = '0';
      iframe.style.width = anchoIframe;
      iframe.style.height = '800px';
      iframe.style.zIndex = '-9999';
      iframe.style.opacity = '0.01';
      iframe.style.pointerEvents = 'none';
      iframe.style.border = 'none';
      document.body.appendChild(iframe);
    } else {
      iframe.style.width = anchoIframe;
    }

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(htmlContent);
    doc.close();

    setTimeout(() => {
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      } catch (err) {
        console.error('Fallo al imprimir cierre desde iframe:', err);
      }
    }, 350);
  } catch (e) {
    console.error('Fallo en motor de impresión de cierre:', e);
  }
}

/**
 * Genera el documento HTML completo para impresión de tickets de venta en Ferretería.
 * Soporta rollos térmicos de 80mm y 58mm.
 */


export function generarHtmlTicket(venta, formato = '80mm', settings = {}) {
  const nombreFerreteria = escapeHtml(settings.businessName || 'FERRETERÍA & MATERIALES HEIS');
  const rucFerreteria = escapeHtml(settings.businessRuc || '20609123456');
  const direccionFerreteria = escapeHtml(settings.address || 'Av. Industrial 840, Ate Vitarte, Lima - Perú');
  const telefonoFerreteria = escapeHtml(settings.phone || '(01) 489-3210 / 998-765-432');

  const fechaFormateada = new Date(venta?.created_at || venta?.createdAt || Date.now()).toLocaleString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const tituloComprobante =
    venta?.tipo_comprobante === 'Factura'
      ? 'FACTURA ELECTRÓNICA'
      : venta?.tipo_comprobante === 'Boleta'
      ? 'BOLETA DE VENTA ELECTRÓNICA'
      : 'TICKET DE VENTA';

  const docTipoCliente =
    venta?.cliente?.tipo_documento === 'RUC'
      ? '6'
      : venta?.cliente?.tipo_documento === 'DNI'
      ? '1'
      : '-';

  const codTipoSunat = venta?.tipo_comprobante === 'Factura' ? '01' : '03';

  const es58mm = formato === '58mm';
  const anchoMm = es58mm ? '58mm' : '80mm';
  const anchoPx = es58mm ? '208px' : '285px';

  const subtotalNum = parseFloat(venta?.subtotal || (parseFloat(venta?.total || 0) / 1.18));
  const igvNum = parseFloat(venta?.igv || (parseFloat(venta?.total || 0) - subtotalNum));
  const totalNum = parseFloat(venta?.total || 0);
  const recibidoNum = parseFloat(venta?.monto_recibido || totalNum);
  const vueltoNum = parseFloat(venta?.vuelto || 0);
  const descuentoNum = parseFloat(venta?.descuento || 0);

  const qrRawString =
    venta?.sunat_qr ||
    `${rucFerreteria}|${codTipoSunat}|${venta?.serie || 'B001'}|${venta?.numero || '000001'}|${igvNum.toFixed(2)}|${totalNum.toFixed(2)}|${fechaFormateada.split(',')[0]}|${docTipoCliente}|${venta?.cliente?.numero_documento || '00000000'}|${venta?.sunat_hash || ''}|`;

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(qrRawString)}`;

  const detalles = Array.isArray(venta?.detalles)
    ? venta.detalles
    : Array.isArray(venta?.items)
    ? venta.items
    : [];

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8"/>
      <title>${tituloComprobante} - ${venta?.numero || 'Ticket'} - ${nombreFerreteria}</title>
      <style>
        @page {
          size: ${anchoMm} auto;
          margin: 0;
        }
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        body {
          font-family: 'Courier New', Courier, monospace, monospace;
          background: #fff;
          color: #000;
          font-size: ${es58mm ? '9px' : '10.5px'};
          line-height: 1.25;
          padding: ${es58mm ? '4px' : '8px'};
          width: ${anchoPx};
          margin: 0 auto;
        }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .font-bold { font-weight: bold; }
        .font-black { font-weight: 900; }
        .border-dashed { border-top: 1px dashed #000; margin: 4px 0; }
        .border-double { border-top: 2px solid #000; margin: 4px 0; }
        .row-between { display: flex; justify-content: space-between; align-items: flex-start; }
      </style>
    </head>
    <body>
      <div class="text-center">
        <h2 class="font-black" style="font-size: ${es58mm ? '11px' : '13px'}; text-transform: uppercase;">
          ${nombreFerreteria}
        </h2>
        <p class="font-bold">R.U.C. N° ${rucFerreteria}</p>
        <p style="font-size: ${es58mm ? '7.5px' : '8.5px'};">${direccionFerreteria}</p>
        <p style="font-size: ${es58mm ? '7.5px' : '8.5px'};">Telf: ${telefonoFerreteria}</p>
      </div>

      <div class="border-dashed"></div>

      <div class="text-center font-bold">
        <p class="font-black" style="font-size: ${es58mm ? '10px' : '12px'};">${tituloComprobante}</p>
        <p class="font-black" style="font-size: ${es58mm ? '11px' : '13px'};">${venta?.numero || 'B001-000001'}</p>
      </div>

      <div class="border-dashed"></div>

      <div>
        <p><strong>FECHA:</strong> ${fechaFormateada}</p>
        <p><strong>CLIENTE:</strong> ${venta?.cliente?.nombre || 'PÚBLICO GENERAL / VARIOS'}</p>
        ${venta?.cliente?.numero_documento ? `<p><strong>${venta.cliente.tipo_documento || 'DOC'}:</strong> ${venta.cliente.numero_documento}</p>` : ''}
        ${venta?.cliente?.direccion ? `<p><strong>DIR:</strong> ${venta.cliente.direccion}</p>` : ''}
        <p><strong>FORMA DE PAGO:</strong> ${venta?.tipo_pago || 'Efectivo'}</p>
        ${venta?.numero_operacion ? `<p><strong>N° OPERACIÓN:</strong> ${venta.numero_operacion}</p>` : ''}
      </div>

      <div class="border-dashed"></div>

      <!-- Detalle de Artículos -->
      <div>
        <div class="row-between font-bold" style="font-size: ${es58mm ? '8px' : '9px'};">
          <span>DESCRIPCIÓN</span>
          <span>TOTAL</span>
        </div>
        <div class="border-dashed"></div>
        ${detalles.map((det) => {
          const prodNom = det.producto?.nombre || det.nombre || 'Artículo';
          const cant = det.cantidad || 1;
          const precio = parseFloat(det.precio_unitario || det.precio || 0);
          const sub = parseFloat(det.subtotal || cant * precio);
          const unid = det.producto?.unidad_medida || det.unidad_medida || 'UND';

          return `
            <div style="margin-bottom: 2px;">
              <p class="font-bold">${prodNom}</p>
              <div class="row-between" style="font-size: ${es58mm ? '7.5px' : '8.5px'}; color: #222;">
                <span>${cant} ${unid} x S/ ${precio.toFixed(2)}</span>
                <span class="font-bold">S/ ${sub.toFixed(2)}</span>
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <div class="border-double"></div>

      <!-- Totales -->
      <div>
        <div class="row-between">
          <span>OP. GRAVADA:</span>
          <span>S/ ${subtotalNum.toFixed(2)}</span>
        </div>
        <div class="row-between">
          <span>I.G.V. (18%):</span>
          <span>S/ ${igvNum.toFixed(2)}</span>
        </div>
        ${descuentoNum > 0 ? `
          <div class="row-between font-bold">
            <span>DESCUENTO:</span>
            <span>- S/ ${descuentoNum.toFixed(2)}</span>
          </div>
        ` : ''}
        <div class="row-between font-black" style="font-size: ${es58mm ? '11px' : '13px'}; border-top: 1px solid #000; padding-top: 2px; margin-top: 2px;">
          <span>TOTAL A PAGAR:</span>
          <span>S/ ${totalNum.toFixed(2)}</span>
        </div>
        ${venta?.tipo_pago === 'Efectivo' ? `
          <div class="row-between" style="font-size: ${es58mm ? '7.5px' : '8.5px'}; margin-top: 2px;">
            <span>EFECTIVO RECIBIDO:</span>
            <span>S/ ${recibidoNum.toFixed(2)}</span>
          </div>
          <div class="row-between font-bold" style="font-size: ${es58mm ? '8.5px' : '9.5px'};">
            <span>VUELTO:</span>
            <span>S/ ${vueltoNum.toFixed(2)}</span>
          </div>
        ` : ''}
      </div>

      <div class="border-dashed"></div>

      <div class="text-center" style="margin-top: 4px;">
        ${settings.ticketShowQr !== false ? `
          <img src="${qrUrl}" alt="QR" style="width: ${es58mm ? '70px' : '90px'}; height: ${es58mm ? '70px' : '90px'}; margin: 0 auto; display: block;" />
          <p style="font-size: 7px; margin-top: 3px; text-transform: uppercase;">Representación Impresa Autorizada</p>
        ` : ''}
        <p style="font-size: 7.5px; margin-top: 3px;">${settings.ticketFooterText || '¡Gracias por construir con nosotros!'}</p>
      </div>
    </body>
    </html>
  `;
}

/**
 * Dispara la impresión física del comprobante de venta en 80mm o 58mm.
 */
function imprimirTicketTermicoHtml(venta, { formato = '80mm', settings = {}, autoPrint = true } = {}) {
  const htmlContent = generarHtmlTicket(venta, formato, settings);

  try {
    const anchoWin = formato === '58mm' ? 340 : 420;
    const printWindow = window.open(
      '',
      '_blank',
      `width=${anchoWin},height=700,left=150,top=60,scrollbars=yes,menubar=no,toolbar=no,location=no,status=no`
    );

    if (printWindow && !printWindow.closed) {
      printWindow.document.open();
      printWindow.document.write(htmlContent);
      printWindow.document.close();

      if (autoPrint) {
        const dispararImpresion = () => {
          try {
            printWindow.focus();
            printWindow.print();
          } catch (err) {
            console.warn('Error en printWindow.print():', err);
          }
        };

        if (printWindow.document.readyState === 'complete') {
          setTimeout(dispararImpresion, 300);
        } else {
          printWindow.onload = () => setTimeout(dispararImpresion, 300);
          setTimeout(dispararImpresion, 600);
        }
      } else {
        printWindow.focus();
      }
      return;
    }
  } catch (popupErr) {
    console.warn('Popup bloqueado, usando iframe:', popupErr);
  }

  // Fallback iframe
  try {
    let iframe = document.getElementById('print-ticket-engine-iframe');
    const anchoIframe = formato === '58mm' ? '58mm' : '80mm';

    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = 'print-ticket-engine-iframe';
      iframe.style.position = 'fixed';
      iframe.style.left = '0';
      iframe.style.top = '0';
      iframe.style.width = anchoIframe;
      iframe.style.height = '800px';
      iframe.style.zIndex = '-9999';
      iframe.style.opacity = '0.01';
      iframe.style.pointerEvents = 'none';
      iframe.style.border = 'none';
      document.body.appendChild(iframe);
    } else {
      iframe.style.width = anchoIframe;
    }

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(htmlContent);
    doc.close();

    setTimeout(() => {
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      } catch (err) {
        console.error('Fallo al imprimir ticket desde iframe:', err);
      }
    }, 350);
  } catch (e) {
    console.error('Fallo en motor de impresión de ticket:', e);
  }
}

/**
 * Genera el documento HTML para Recibo de Cobranza / Vale de Abono en rollo térmico (80mm / 58mm).
 */


export function generarHtmlReciboCobranza(abonoData, formato = '80mm', settings = {}) {
  const nombreFerreteria = settings.businessName || 'FERRETERÍA & MATERIALES HEIS';
  const rucFerreteria = settings.businessRuc || '20609123456';
  const direccionFerreteria = settings.address || 'Av. Industrial 840, Ate Vitarte, Lima - Perú';
  const telefonoFerreteria = settings.phone || '(01) 489-3210 / 998-765-432';

  const es58mm = formato === '58mm';
  const anchoMm = es58mm ? '58mm' : '80mm';
  const anchoPx = es58mm ? '208px' : '285px';

  const montoAbonado = parseFloat(abonoData?.monto || 0);
  const saldoAnterior = parseFloat(abonoData?.saldo_anterior ?? (parseFloat(abonoData?.saldo_restante || 0) + montoAbonado));
  const saldoRestante = parseFloat(abonoData?.saldo_restante ?? Math.max(0, saldoAnterior - montoAbonado));

  const fechaFmt = new Date(abonoData?.fecha || Date.now()).toLocaleString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const clienteNombre = abonoData?.cliente?.nombre || abonoData?.cliente?.razon_social || 'Cliente de Obra';
  const clienteDoc = abonoData?.cliente?.numero_documento ? `${abonoData?.cliente?.tipo_documento || 'DOC'}: ${abonoData.cliente.numero_documento}` : '';
  const obra = abonoData?.cliente?.contacto_obra || abonoData?.cliente?.direccion_obra || '';
  const docAfectado = abonoData?.venta?.numero || (abonoData?.id_cuenta_cobrar ? `Cuenta #${abonoData.id_cuenta_cobrar}` : 'Venta a Crédito');

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8"/>
      <title>Recibo de Cobranza #${abonoData?.id || '001'} - ${nombreFerreteria}</title>
      <style>
        @page { size: ${anchoMm} auto; margin: 0; }
        * { box-sizing: border-box; margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        body {
          font-family: 'Courier New', Courier, monospace;
          background: #fff;
          color: #000;
          font-size: ${es58mm ? '9px' : '10.5px'};
          line-height: 1.25;
          padding: ${es58mm ? '4px' : '8px'};
          width: ${anchoPx};
          margin: 0 auto;
        }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .font-bold { font-weight: bold; }
        .font-black { font-weight: 900; }
        .uppercase { text-transform: uppercase; }
        .border-dashed { border-top: 1px dashed #000; margin: 4px 0; }
        .row-between { display: flex; justify-content: space-between; align-items: baseline; }
        .truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .no-print { display: block; }
        @media screen {
          body {
            margin: 20px auto;
            box-shadow: 0 4px 20px rgba(0,0,0,0.15);
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 14px 10px;
          }
          .barra-control-print {
            background: #0f172a;
            color: #fff;
            padding: 10px 14px;
            margin: -14px -10px 14px -10px;
            border-radius: 8px 8px 0 0;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-family: sans-serif;
          }
          .barra-btn-print {
            background: #10b981;
            color: #fff;
            font-weight: 800;
            font-size: 12px;
            padding: 8px 16px;
            border-radius: 8px;
            border: none;
            cursor: pointer;
          }
          .barra-btn-close {
            background: #334155;
            color: #cbd5e1;
            font-weight: 700;
            font-size: 12px;
            padding: 8px 14px;
            border-radius: 8px;
            border: none;
            cursor: pointer;
            margin-left: 6px;
          }
        }
        @media print {
          .no-print { display: none !important; }
          body { margin: 0 !important; padding: 0 !important; box-shadow: none !important; border: none !important; border-radius: 0 !important; }
        }
      </style>
    </head>
    <body>
      <div class="no-print barra-control-print">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-weight: 900; font-size: 13px;">💵 RECIBO DE COBRANZA</span>
          <span style="background: #10b981; color: #fff; font-size: 10px; font-weight: 900; padding: 2px 7px; border-radius: 6px;">${formato}</span>
        </div>
        <div>
          <button type="button" onclick="window.print()" class="barra-btn-print">🖨️ IMPRIMIR</button>
          <button type="button" onclick="window.close()" class="barra-btn-close">Cerrar</button>
        </div>
      </div>

      <div class="text-center" style="margin-bottom: 4px;">
        <div class="font-black uppercase" style="font-size: ${es58mm ? '11px' : '13px'};">${nombreFerreteria}</div>
        <div class="font-bold">R.U.C. N° ${rucFerreteria}</div>
        <div style="font-size: ${es58mm ? '8px' : '9.5px'};">${direccionFerreteria}</div>
        <div style="font-size: ${es58mm ? '8px' : '9.5px'};">Telf: ${telefonoFerreteria}</div>
      </div>

      <div class="border-dashed"></div>

      <div class="text-center" style="margin: 3px 0;">
        <div class="font-black uppercase" style="font-size: ${es58mm ? '10px' : '12px'};">
          *** RECIBO DE COBRANZA / ABONO ***
        </div>
        <div class="font-bold" style="font-size: ${es58mm ? '9px' : '10.5px'};">
          N° OPERACIÓN: #${String(abonoData?.id || '001').padStart(6, '0')}
        </div>
        <div style="font-size: ${es58mm ? '8px' : '9.5px'}; color: #333;">FECHA: ${fechaFmt}</div>
      </div>

      <div class="border-dashed"></div>

      <div style="font-size: ${es58mm ? '8.5px' : '10px'};">
        <div class="row-between">
          <span class="font-bold">CLIENTE:</span>
          <span class="text-right truncate font-bold" style="max-width: ${es58mm ? '130px' : '180px'};">${clienteNombre}</span>
        </div>
        ${clienteDoc ? `
          <div class="row-between">
            <span>DOCUMENTO:</span>
            <span>${clienteDoc}</span>
          </div>
        ` : ''}
        ${obra ? `
          <div class="row-between">
            <span>OBRA/REFERENCIA:</span>
            <span class="truncate" style="max-width: ${es58mm ? '120px' : '170px'};">${obra}</span>
          </div>
        ` : ''}
        <div class="row-between">
          <span>COMPROBANTE AFECTO:</span>
          <span class="font-bold">${docAfectado}</span>
        </div>
        <div class="row-between">
          <span>MÉTODO DE PAGO:</span>
          <span class="font-bold uppercase">${abonoData?.metodo_pago || 'Efectivo'}</span>
        </div>
      </div>

      <div class="border-dashed"></div>

      <div style="font-size: ${es58mm ? '9px' : '10.5px'}; margin: 4px 0;">
        <div class="row-between">
          <span>SALDO ANTERIOR:</span>
          <span>S/ ${saldoAnterior.toFixed(2)}</span>
        </div>
        <div class="row-between font-black" style="font-size: ${es58mm ? '11px' : '13px'}; margin: 2px 0;">
          <span>MONTO ABONADO:</span>
          <span>S/ ${montoAbonado.toFixed(2)}</span>
        </div>
        <div class="row-between font-bold" style="border-top: 1px dotted #888; padding-top: 2px;">
          <span>SALDO RESTANTE:</span>
          <span>S/ ${saldoRestante.toFixed(2)}</span>
        </div>
      </div>

      ${saldoRestante <= 0 ? `
        <div class="text-center font-black" style="border: 1px solid #000; padding: 2px; margin: 4px 0; font-size: ${es58mm ? '8.5px' : '10px'};">
          *** CUENTA TOTALMENTE CANCELADA ***
        </div>
      ` : ''}

      ${abonoData?.notas ? `
        <div style="font-size: ${es58mm ? '8px' : '9px'}; color: #444; margin-top: 4px;">
          <strong>Notas:</strong> ${abonoData.notas}
        </div>
      ` : ''}

      <div class="border-dashed"></div>

      <div style="margin-top: 22px; text-align: center; font-size: ${es58mm ? '8px' : '9px'};">
        <div style="display: flex; justify-content: space-around;">
          <div>
            <div style="width: ${es58mm ? '80px' : '110px'}; border-top: 1px solid #000; margin: 0 auto 2px auto;"></div>
            <div>Cajero / Cobrador</div>
          </div>
          <div>
            <div style="width: ${es58mm ? '80px' : '110px'}; border-top: 1px solid #000; margin: 0 auto 2px auto;"></div>
            <div>Cliente Conforme</div>
          </div>
        </div>
        <div style="margin-top: 10px; font-size: ${es58mm ? '7.5px' : '8.5px'}; color: #666;">
          ¡Gracias por su puntualidad en sus pagos!
        </div>
      </div>
    </body>
    </html>
  `;
}

export function imprimirReciboCobranza(abonoData, { formato = '80mm', settings = {}, autoPrint = true } = {}) {
  const htmlContent = generarHtmlReciboCobranza(abonoData, formato, settings);

  try {
    const anchoWin = formato === '58mm' ? 340 : 420;
    const printWindow = window.open(
      '',
      '_blank',
      `width=${anchoWin},height=650,left=200,top=80,scrollbars=yes,menubar=no,toolbar=no,location=no,status=no`
    );

    if (printWindow && !printWindow.closed) {
      printWindow.document.open();
      printWindow.document.write(htmlContent);
      printWindow.document.close();

      if (autoPrint) {
        const dispararImpresion = () => {
          try {
            printWindow.focus();
            printWindow.print();
          } catch (err) {
            console.warn('Error en printWindow.print():', err);
          }
        };

        if (printWindow.document.readyState === 'complete') {
          setTimeout(dispararImpresion, 300);
        } else {
          printWindow.onload = () => setTimeout(dispararImpresion, 300);
          setTimeout(dispararImpresion, 600);
        }
      } else {
        printWindow.focus();
      }
      return;
    }
  } catch (popupErr) {
    console.warn('Popup bloqueado, usando iframe:', popupErr);
  }

  // Fallback iframe
  try {
    let iframe = document.getElementById('print-recibo-cobranza-iframe');
    const anchoIframe = formato === '58mm' ? '58mm' : '80mm';

    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = 'print-recibo-cobranza-iframe';
      iframe.style.position = 'fixed';
      iframe.style.left = '0';
      iframe.style.top = '0';
      iframe.style.width = anchoIframe;
      iframe.style.height = '700px';
      iframe.style.zIndex = '-9999';
      iframe.style.opacity = '0.01';
      iframe.style.pointerEvents = 'none';
      iframe.style.border = 'none';
      document.body.appendChild(iframe);
    }

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(htmlContent);
    doc.close();

    setTimeout(() => {
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      } catch (err) {
        console.error('Fallo al imprimir recibo desde iframe:', err);
      }
    }, 350);
  } catch (e) {
    console.error('Fallo en motor de impresión de recibo cobranza:', e);
  }
}

/**
 * Genera el documento HTML para Estado de Cuenta de Cliente / Obra (Formato 80mm o A4/Reporte).
 */


export function generarHtmlEstadoCuentaCliente(clienteData, formato = '80mm', settings = {}) {
  const nombreFerreteria = settings.businessName || 'FERRETERÍA & MATERIALES HEIS';
  const rucFerreteria = settings.businessRuc || '20609123456';
  const direccionFerreteria = settings.address || 'Av. Industrial 840, Ate Vitarte, Lima - Perú';
  const telefonoFerreteria = settings.phone || '(01) 489-3210 / 998-765-432';

  const es58mm = formato === '58mm';
  const anchoMm = es58mm ? '58mm' : '80mm';
  const anchoPx = es58mm ? '210px' : '290px';

  const c = clienteData?.cliente || clienteData || {};
  const cuentas = Array.isArray(clienteData?.cuentasPendientes) ? clienteData.cuentasPendientes : [];
  const limiteCredito = parseFloat(c.limite_credito || clienteData?.limiteCredito || 0);
  const deudaTotal = parseFloat(c.deuda_total || clienteData?.totalDeuda || cuentas.reduce((acc, cc) => acc + parseFloat(cc.saldo_pendiente || 0), 0));
  const disponible = parseFloat(c.credito_disponible ?? Math.max(0, limiteCredito - deudaTotal));
  const diasPlazo = c.dias_credito || 30;

  const fechaFmt = new Date().toLocaleString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8"/>
      <title>Estado de Cuenta - ${c.nombre || 'Cliente'} - ${nombreFerreteria}</title>
      <style>
        @page { size: ${anchoMm} auto; margin: 0; }
        * { box-sizing: border-box; margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        body {
          font-family: 'Courier New', Courier, monospace;
          background: #fff;
          color: #000;
          font-size: ${es58mm ? '9px' : '10px'};
          line-height: 1.25;
          padding: 8px 6px;
          width: ${anchoPx};
          margin: 0 auto;
        }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .font-bold { font-weight: bold; }
        .font-black { font-weight: 900; }
        .uppercase { text-transform: uppercase; }
        .border-dashed { border-top: 1px dashed #000; margin: 4px 0; }
        .row-between { display: flex; justify-content: space-between; align-items: baseline; }
        .truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .no-print { display: block; }
        @media screen {
          body {
            margin: 20px auto;
            box-shadow: 0 4px 20px rgba(0,0,0,0.15);
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 14px 10px;
          }
          .barra-control-print {
            background: #1e1b4b;
            color: #fff;
            padding: 10px 14px;
            margin: -14px -10px 14px -10px;
            border-radius: 8px 8px 0 0;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-family: sans-serif;
          }
          .barra-btn-print {
            background: #4f46e5;
            color: #fff;
            font-weight: 800;
            font-size: 12px;
            padding: 8px 16px;
            border-radius: 8px;
            border: none;
            cursor: pointer;
          }
          .barra-btn-close {
            background: #334155;
            color: #cbd5e1;
            font-weight: 700;
            font-size: 12px;
            padding: 8px 14px;
            border-radius: 8px;
            border: none;
            cursor: pointer;
            margin-left: 6px;
          }
        }
        @media print {
          .no-print { display: none !important; }
          body { margin: 0 !important; padding: 0 !important; box-shadow: none !important; border: none !important; border-radius: 0 !important; }
        }
      </style>
    </head>
    <body>
      <div class="no-print barra-control-print">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-weight: 900; font-size: 13px;">🏗️ ESTADO DE CUENTA</span>
          <span style="background: #4f46e5; color: #fff; font-size: 10px; font-weight: 900; padding: 2px 7px; border-radius: 6px;">${formato}</span>
        </div>
        <div>
          <button type="button" onclick="window.print()" class="barra-btn-print">🖨️ IMPRIMIR</button>
          <button type="button" onclick="window.close()" class="barra-btn-close">Cerrar</button>
        </div>
      </div>

      <div class="text-center">
        <div class="font-black uppercase" style="font-size: ${es58mm ? '11px' : '13px'};">${nombreFerreteria}</div>
        <div class="font-bold">R.U.C. N° ${rucFerreteria}</div>
        <div style="font-size: ${es58mm ? '8px' : '9px'};">${direccionFerreteria}</div>
        <div style="font-size: ${es58mm ? '8px' : '9px'};">Telf: ${telefonoFerreteria}</div>
      </div>

      <div class="border-dashed"></div>

      <div class="text-center" style="margin: 3px 0;">
        <div class="font-black uppercase" style="font-size: ${es58mm ? '10px' : '11.5px'};">
          *** ESTADO DE CUENTA / CRÉDITO ***
        </div>
        <div style="font-size: 8.5px; color: #333;">EMISIÓN: ${fechaFmt}</div>
      </div>

      <div class="border-dashed"></div>

      <div style="font-size: ${es58mm ? '8.5px' : '9.5px'};">
        <div class="row-between">
          <span class="font-bold">CLIENTE:</span>
          <span class="font-bold truncate" style="max-width: 170px;">${c.nombre || 'Cliente'}</span>
        </div>
        ${c.numero_documento ? `
          <div class="row-between">
            <span>DOCUMENTO:</span>
            <span>${c.tipo_documento || 'RUC/DNI'}: ${c.numero_documento}</span>
          </div>
        ` : ''}
        ${c.contacto_obra ? `
          <div class="row-between">
            <span>CONTACTO OBRA:</span>
            <span>${c.contacto_obra}</span>
          </div>
        ` : ''}
        ${c.direccion_obra ? `
          <div class="row-between">
            <span>OBRA:</span>
            <span class="truncate" style="max-width: 170px;">${c.direccion_obra}</span>
          </div>
        ` : ''}
        <div class="row-between">
          <span>PLAZO CONCEDIDO:</span>
          <span class="font-bold">${diasPlazo} días</span>
        </div>
      </div>

      <div class="border-dashed"></div>

      <div style="font-size: ${es58mm ? '9px' : '10px'};">
        <div class="row-between">
          <span>LÍNEA AUTORIZADA:</span>
          <span class="font-bold">S/ ${limiteCredito.toFixed(2)}</span>
        </div>
        <div class="row-between font-black" style="font-size: ${es58mm ? '10.5px' : '12px'}; color: #991b1b;">
          <span>DEUDA ACUMULADA:</span>
          <span>S/ ${deudaTotal.toFixed(2)}</span>
        </div>
        <div class="row-between font-bold" style="color: #065f46;">
          <span>CRÉDITO DISPONIBLE:</span>
          <span>S/ ${disponible.toFixed(2)}</span>
        </div>
      </div>

      <div class="border-dashed"></div>

      <!-- Detalle de Comprobantes Pendientes -->
      <div style="font-size: 8.5px;">
        <div class="font-black uppercase" style="margin-bottom: 3px;">
          DOCUMENTOS POR REGULARIZAR (${cuentas.length}):
        </div>
        ${cuentas.length === 0 ? `
          <div class="text-center" style="padding: 4px 0; font-weight: bold; color: #065f46;">
            NO TIENE COMPROBANTES PENDIENTES
          </div>
        ` : `
          <table style="width: 100%; border-collapse: collapse; font-size: 8px;">
            <thead>
              <tr style="border-bottom: 1px dotted #000; text-align: left;">
                <th style="padding: 2px 0;">DOC / VENC</th>
                <th style="text-align: right; padding: 2px 0;">TOTAL</th>
                <th style="text-align: right; padding: 2px 0;">SALDO</th>
              </tr>
            </thead>
            <tbody>
              ${cuentas.map(item => `
                <tr>
                  <td style="padding: 2px 0;">
                    <div class="font-bold">${item.venta?.numero || ('#' + item.id)}</div>
                    <div style="font-size: 7.5px; color: #555;">Vence: ${item.fecha_vencimiento || '-'}</div>
                  </td>
                  <td style="text-align: right; padding: 2px 0;">S/ ${parseFloat(item.monto_total || 0).toFixed(2)}</td>
                  <td style="text-align: right; padding: 2px 0;" class="font-bold">S/ ${parseFloat(item.saldo_pendiente || 0).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `}
      </div>

      <div class="border-dashed"></div>

      <div style="margin-top: 15px; text-align: center; font-size: 8px;">
        <div>Agradecemos coordinar la cancelación de sus saldos pendientes.</div>
        <div style="font-weight: bold; margin-top: 3px;">FERRETERÍA & MATERIALES PRO</div>
      </div>
    </body>
    </html>
  `;
}

export function imprimirEstadoCuentaCliente(clienteData, { formato = '80mm', settings = {}, autoPrint = true } = {}) {
  const htmlContent = generarHtmlEstadoCuentaCliente(clienteData, formato, settings);

  try {
    const anchoWin = formato === '58mm' ? 340 : 420;
    const printWindow = window.open(
      '',
      '_blank',
      `width=${anchoWin},height=700,left=220,top=60,scrollbars=yes,menubar=no,toolbar=no,location=no,status=no`
    );

    if (printWindow && !printWindow.closed) {
      printWindow.document.open();
      printWindow.document.write(htmlContent);
      printWindow.document.close();

      if (autoPrint) {
        const dispararImpresion = () => {
          try {
            printWindow.focus();
            printWindow.print();
          } catch (err) {
            console.warn('Error en printWindow.print():', err);
          }
        };

        if (printWindow.document.readyState === 'complete') {
          setTimeout(dispararImpresion, 300);
        } else {
          printWindow.onload = () => setTimeout(dispararImpresion, 300);
          setTimeout(dispararImpresion, 600);
        }
      } else {
        printWindow.focus();
      }
      return;
    }
  } catch (popupErr) {
    console.warn('Popup bloqueado, usando iframe:', popupErr);
  }

  // Fallback iframe
  try {
    let iframe = document.getElementById('print-estado-cuenta-iframe');
    const anchoIframe = formato === '58mm' ? '58mm' : '80mm';

    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = 'print-estado-cuenta-iframe';
      iframe.style.position = 'fixed';
      iframe.style.left = '0';
      iframe.style.top = '0';
      iframe.style.width = anchoIframe;
      iframe.style.height = '800px';
      iframe.style.zIndex = '-9999';
      iframe.style.opacity = '0.01';
      iframe.style.pointerEvents = 'none';
      iframe.style.border = 'none';
      document.body.appendChild(iframe);
    }

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(htmlContent);
    doc.close();

    setTimeout(() => {
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      } catch (err) {
        console.error('Fallo al imprimir estado de cuenta desde iframe:', err);
      }
    }, 350);
  } catch (e) {
    console.error('Fallo en motor de impresión estado de cuenta:', e);
  }
}



/**
 * Función Principal Unificada para toda la suite HEIS
 */
export async function imprimirTicketTermico(ticketOrVenta, options = {}) {
  const formato = options.formato || ticketOrVenta?.formato || (typeof localStorage !== 'undefined' ? localStorage.getItem('heis_paper_format') : null) || '80mm';
  const metodoPreferido = options.metodo || (typeof localStorage !== 'undefined' ? localStorage.getItem('heis_print_method') : null) || 'AUTO';

  if (metodoPreferido === 'BRIDGE_LOCAL' || metodoPreferido === 'WEB_SERIAL') {
    try {
      const escPos = compilarTicketEscPos(ticketOrVenta, { ...options, formato });
      if (metodoPreferido === 'BRIDGE_LOCAL') {
        return await imprimirViaBridgeLocal(escPos, ticketOrVenta, { ...options, formato });
      }
      return await imprimirViaWebSerial(escPos);
    } catch (err) {
      console.warn('[HEIS_PRINT] Falló método directo, usando render HTML:', err.message);
    }
  }

  // Fallback: usar el motor visual HTML completo (iframe / printWindow)
  return imprimirTicketTermicoHtml(ticketOrVenta, { ...options, formato });
}

export default {
  PAPER_PROFILES,
  EscPosBuilder,
  buildSunatQrPayload,
  compilarTicketEscPos,
  imprimirTicketTermico,
  imprimirTicketCierreCaja,
  generarHtmlTicketCierreCaja,
  imprimirReciboCobranza,
  generarHtmlReciboCobranza,
  imprimirEstadoCuentaCliente,
  generarHtmlEstadoCuentaCliente,
  escapeHtml,
  escHtml,
};
