/**
 * impresionTermica.js — Motor de Impresión Térmica ESC/POS y Formatos Oficiales
 * 
 * Permite imprimir comprobantes directamente en formatos:
 * - '80mm': Rollo térmico estándar de botica/farmacia (ancho 76-80mm)
 * - '58mm': Rollo térmico compacto / mini impresora Bluetooth (ancho 50-54mm)
 * - 'A4': Hoja completa formal A4 para empresas o clientes que solicitan factura impresa
 * 
 * Utiliza un <iframe> aislado para garantizar que el cuadro de diálogo de impresión
 * adopte el tamaño de página exacto (@page { size: ... }) sin interferencia del DOM de React.
 */

/**
 * Escapa caracteres HTML peligrosos para prevenir vulnerabilidades XSS en tickets de impresión.
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

export function generarHtmlTicket(venta, formato = '80mm', settings = {}) {
  const nombreBotica = escapeHtml(settings.businessName || 'BOTICA HEIS & SALUD');
  const rucBotica = escapeHtml(settings.businessRuc || '20608945123');
  const direccionBotica = escapeHtml(settings.address || 'Av. Las Palmas 450, San Isidro - Lima');
  const telefonoBotica = escapeHtml(settings.phone || '(01) 489-3210 / 998-765-432');
  const qfResponsable = escapeHtml(venta?.usuario?.colegiatura_qf
    ? `${venta?.usuario?.nombre || 'Director Técnico'} (${venta.usuario.colegiatura_qf})`
    : (settings.technicalDirector || 'Q.F. Responsable Reg. CQFP'));

  const fechaFormateada = new Date(venta?.created_at || venta?.createdAt || Date.now()).toLocaleString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  const tituloComprobante =
    venta?.tipo_comprobante === 'Factura'
      ? 'FACTURA ELECTRÓNICA'
      : venta?.tipo_comprobante === 'NotaCredito'
      ? 'NOTA DE CRÉDITO ELECTRÓNICA'
      : venta?.tipo_comprobante === 'Boleta'
      ? 'BOLETA DE VENTA ELECTRÓNICA'
      : 'TICKET DE DISPENSACIÓN';

  const docTipoCliente =
    venta?.cliente?.tipo_documento === 'RUC'
      ? '6'
      : venta?.cliente?.tipo_documento === 'DNI'
      ? '1'
      : '-';

  const codTipoSunat =
    venta?.tipo_comprobante === 'Factura'
      ? '01'
      : venta?.tipo_comprobante === 'NotaCredito'
      ? '07'
      : '03';

  // Cadena oficial QR según estándar SUNAT
  const qrRawString =
    venta?.sunat_qr ||
    `${rucBotica}|${codTipoSunat}|${venta?.serie || 'B001'}|${venta?.numero || '000001'}|${parseFloat(venta?.igv || 0).toFixed(2)}|${parseFloat(venta?.total || 0).toFixed(2)}|${fechaFormateada.split(',')[0]}|${docTipoCliente}|${venta?.cliente?.numero_documento || '00000000'}|${venta?.sunat_hash || ''}|`;

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(
    qrRawString
  )}`;

  const totalNum = parseFloat(venta?.total || 0);
  const subtotalNum = parseFloat(venta?.subtotal || (totalNum / 1.18));
  const igvNum = parseFloat(venta?.igv || (totalNum - subtotalNum));
  const descuentoNum = parseFloat(venta?.descuento || 0);
  const vueltoNum = parseFloat(venta?.vuelto || 0);
  const recibidoNum = parseFloat(venta?.monto_recibido || totalNum);

  const detalles = venta?.detalles || [];

  // Configuración según formato
  const esA4 = formato === 'A4';
  const es58mm = formato === '58mm';

  let cssFormato = '';
  if (esA4) {
    cssFormato = `
      @page {
        size: A4 portrait;
        margin: 10mm 12mm;
      }
      html, body {
        width: 100%;
        max-width: 185mm;
        margin: 0 auto;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        font-size: 11.5px;
        color: #0f172a;
        background: #fff;
        line-height: 1.4;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
    `;
  } else if (es58mm) {
    cssFormato = `
      @page {
        size: auto;
        margin: 0mm;
      }
      html, body {
        width: 52mm;
        max-width: 52mm;
        margin: 0 auto;
        padding: 1.5mm 1.5mm;
        font-family: 'Courier New', Courier, monospace;
        font-size: 9.5px;
        font-weight: 600;
        color: #000;
        background: #fff;
        line-height: 1.15;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
    `;
  } else {
    // 80mm por defecto
    cssFormato = `
      @page {
        size: auto;
        margin: 0mm;
      }
      html, body {
        width: 76mm;
        max-width: 76mm;
        margin: 0 auto;
        padding: 2mm 2.5mm;
        font-family: 'Courier New', Courier, monospace;
        font-size: 11px;
        font-weight: 600;
        color: #000;
        background: #fff;
        line-height: 1.25;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
    `;
  }

  // Si es A4, renderizamos una factura institucional completa
  if (esA4) {
    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="utf-8" />
        <title>${tituloComprobante} - ${venta?.numero || 'B001-000001'}</title>
        <style>
          ${cssFormato}
          * { box-sizing: border-box; }
          .header-box { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; border-bottom: 2px solid #059669; padding-bottom: 12px; }
          .logo-text h1 { margin: 0; font-size: 20px; font-weight: 900; color: #047857; text-transform: uppercase; }
          .logo-text p { margin: 2px 0; font-size: 11px; color: #475569; }
          .ruc-box { border: 2px solid #047857; border-radius: 8px; padding: 10px 16px; text-align: center; background: #ecfdf5; min-width: 220px; }
          .ruc-box h3 { margin: 0; font-size: 14px; font-weight: 800; color: #065f46; }
          .ruc-box h2 { margin: 4px 0; font-size: 16px; font-weight: 900; color: #047857; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; font-size: 11px; }
          .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          .items-table th { background: #047857; color: #fff; text-align: left; padding: 7px 8px; font-size: 10.5px; text-transform: uppercase; }
          .items-table td { padding: 8px; border-bottom: 1px solid #e2e8f0; font-size: 11px; }
          .totals-section { display: flex; justify-content: space-between; align-items: flex-start; margin-top: 15px; }
          .qr-area { text-align: center; max-width: 150px; }
          .totals-table { min-width: 260px; font-size: 11.5px; border-collapse: collapse; }
          .totals-table td { padding: 4px 8px; }
          .totals-table tr.total-row { font-size: 14px; font-weight: 900; color: #047857; border-top: 2px solid #047857; background: #ecfdf5; }
          .footer-note { margin-top: 24px; padding-top: 10px; border-top: 1px dashed #cbd5e1; font-size: 9.5px; color: #64748b; text-align: center; }
        </style>
      </head>
      <body>
        <div class="header-box">
          <div class="logo-text">
            <h1>${nombreBotica}</h1>
            <p><strong>RUC:</strong> ${rucBotica}</p>
            <p>${direccionBotica}</p>
            <p><strong>Teléfono:</strong> ${telefonoBotica}</p>
            <p style="color:#047857; font-weight:bold;">Dir. Técnico: ${qfResponsable}</p>
          </div>
          <div class="ruc-box">
            <h3>R.U.C. N° ${rucBotica}</h3>
            <h2>${tituloComprobante}</h2>
            <h3>${venta?.numero || 'B001-000001'}</h3>
          </div>
        </div>

        <div class="info-grid">
          <div>
            <p><strong>FECHA DE EMISIÓN:</strong> ${fechaFormateada}</p>
            <p><strong>CLIENTE:</strong> ${venta?.cliente?.nombre || 'CLIENTE VARIOS / PÚBLICO GENERAL'}</p>
            <p><strong>${venta?.cliente?.tipo_documento || 'DOC'}:</strong> ${venta?.cliente?.numero_documento || '-'}</p>
            ${venta?.cliente?.direccion ? `<p><strong>DIRECCIÓN:</strong> ${venta.cliente.direccion}</p>` : ''}
          </div>
          <div>
            <p><strong>FORMA DE PAGO:</strong> ${venta?.tipo_pago || 'Efectivo'}</p>
            <p><strong>CAJERO / ATENCIÓN:</strong> ${venta?.usuario?.nombre || 'Dispensador'}</p>
            ${venta?.medico_cmp ? `<p><strong>RECETA CMP:</strong> ${venta.medico_cmp}</p>` : ''}
            ${venta?.numero_operacion ? `<p><strong>N° OPERACIÓN:</strong> ${venta.numero_operacion}</p>` : ''}
          </div>
        </div>

        <table class="items-table">
          <thead>
            <tr>
              <th style="width: 50px; text-align: center;">CANT</th>
              <th style="width: 50px;">UNID</th>
              <th>DESCRIPCIÓN DEL MEDICAMENTO / PRODUCTO</th>
              <th style="width: 100px;">LOTE / VENC</th>
              <th style="width: 80px; text-align: right;">P. UNIT</th>
              <th style="width: 90px; text-align: right;">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            ${detalles.map((det) => `
              <tr>
                <td style="text-align: center; font-weight: bold;">${det.cantidad}</td>
                <td>${det.formato_venta === 'Fraccion' ? 'Fracción' : 'Caja'}</td>
                <td>
                  <strong>${det.medicamento?.nombre_comercial || 'Medicamento'}</strong>
                  ${det.medicamento?.concentracion ? `<span style="color:#64748b;"> - ${det.medicamento.concentracion}</span>` : ''}
                </td>
                <td style="font-size: 10px; color:#475569;">
                  Lt: ${det.lote?.numero_lote || 'FEFO'}
                  ${det.lote?.fecha_vencimiento ? `<br/>V: ${det.lote.fecha_vencimiento}` : ''}
                </td>
                <td style="text-align: right;">S/ ${parseFloat(det.precio_unitario || 0).toFixed(2)}</td>
                <td style="text-align: right; font-weight: bold;">S/ ${parseFloat(det.subtotal || 0).toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="totals-section">
          <div class="qr-area">
            <img src="${qrUrl}" alt="QR SUNAT" style="width: 110px; height: 110px; border: 1px solid #cbd5e1; padding: 4px; border-radius: 6px;" />
            <p style="font-size: 8.5px; margin: 4px 0; color:#475569;">Representación Impresa Autorizada</p>
            ${venta?.sunat_hash ? `<p style="font-size: 7.5px; word-break: break-all; color:#64748b;">Hash: ${venta.sunat_hash}</p>` : ''}
          </div>

          <table class="totals-table">
            <tr>
              <td>OP. GRAVADA:</td>
              <td style="text-align: right;">S/ ${subtotalNum.toFixed(2)}</td>
            </tr>
            <tr>
              <td>I.G.V. (18%):</td>
              <td style="text-align: right;">S/ ${igvNum.toFixed(2)}</td>
            </tr>
            ${descuentoNum > 0 ? `
              <tr style="color: #dc2626; font-weight: bold;">
                <td>DESCUENTO:</td>
                <td style="text-align: right;">- S/ ${descuentoNum.toFixed(2)}</td>
              </tr>
            ` : ''}
            <tr class="total-row">
              <td>TOTAL A PAGAR:</td>
              <td style="text-align: right;">S/ ${totalNum.toFixed(2)}</td>
            </tr>
            ${venta?.tipo_pago === 'Efectivo' ? `
              <tr style="font-size: 10.5px; color:#64748b;">
                <td>EFECTIVO RECIBIDO:</td>
                <td style="text-align: right;">S/ ${recibidoNum.toFixed(2)}</td>
              </tr>
              <tr style="font-size: 10.5px; color:#64748b;">
                <td>VUELTO:</td>
                <td style="text-align: right; font-weight: bold; color: #047857;">S/ ${vueltoNum.toFixed(2)}</td>
              </tr>
            ` : ''}
          </table>
        </div>

        <div class="footer-note">
          Consulte la validez de este comprobante en www.sunat.gob.pe.<br/>
          Medicamentos dispensados sujetos a normativa DIGEMID. ¡Gracias por confiar en nosotros!
        </div>
      </body>
      </html>
    `;
  }

  // Formato Térmico (80mm o 58mm)
  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="utf-8" />
      <title>${tituloComprobante} - ${venta?.numero || 'B001-000001'}</title>
      <style>
        ${cssFormato}
        * { box-sizing: border-box; }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .text-left { text-align: left; }
        .font-bold { font-weight: bold; }
        .font-black { font-weight: 900; }
        .uppercase { text-transform: uppercase; }
        .border-b-dashed { border-bottom: 1px dashed #000; }
        .border-t-dashed { border-top: 1px dashed #000; }
        .py-1 { padding-top: 3px; padding-bottom: 3px; }
        .py-2 { padding-top: 5px; padding-bottom: 5px; }
        .my-1 { margin-top: 3px; margin-bottom: 3px; }
        .row-between { display: flex; justify-content: space-between; align-items: flex-start; }
        .truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

        @media screen {
          html {
            background: #f1f5f9;
            min-height: 100vh;
            padding: 0;
            margin: 0;
          }
          body {
            background: #ffffff;
            box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.15), 0 2px 6px -1px rgba(0, 0, 0, 0.1);
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            margin: 16px auto 32px auto !important;
          }
          .barra-control-print {
            position: sticky;
            top: 0;
            z-index: 9999;
            background: #0f172a;
            color: #ffffff;
            padding: 10px 16px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          }
          .barra-btn-print {
            background: #059669;
            color: #ffffff;
            font-weight: 800;
            font-size: 13px;
            padding: 8px 16px;
            border-radius: 8px;
            border: none;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            box-shadow: 0 2px 6px rgba(5, 150, 105, 0.3);
            transition: all 0.15s;
          }
          .barra-btn-print:hover {
            background: #047857;
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
            transition: background 0.15s;
          }
          .barra-btn-close:hover {
            background: #475569;
            color: #ffffff;
          }
        }
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
          }
        }
      </style>
    </head>
    <body>
      <!-- Barra Superior de Control (Visible en pantalla, Oculta en Impresión) -->
      <div class="no-print barra-control-print">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-weight: 900; font-size: 13px; letter-spacing: -0.2px;">🏥 VISTA PREVIA</span>
          <span style="background: #059669; color: #fff; font-size: 10px; font-weight: 900; padding: 2px 7px; border-radius: 6px;">${formato}</span>
          <span style="color: #94a3b8; font-size: 11px; font-weight: 600;">${venta?.numero || 'COMPROBANTE'}</span>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <button type="button" onclick="window.print()" class="barra-btn-print">
            🖨️ MANDAR A IMPRIMIR
          </button>
          <button type="button" onclick="window.close()" class="barra-btn-close">
            Cerrar
          </button>
        </div>
      </div>
      <!-- Cabecera Botica -->
      <div class="text-center border-b-dashed py-1">
        <div class="font-black uppercase" style="font-size: ${es58mm ? '11px' : '13px'};">${nombreBotica}</div>
        <div class="font-bold">R.U.C. N° ${rucBotica}</div>
        <div style="font-size: ${es58mm ? '8px' : '9.5px'};">${direccionBotica}</div>
        <div style="font-size: ${es58mm ? '8px' : '9.5px'};">Telf: ${telefonoBotica}</div>
        <div class="font-bold" style="font-size: ${es58mm ? '8px' : '9px'}; margin-top: 2px;">${qfResponsable}</div>
      </div>

      <!-- Datos Comprobante -->
      <div class="border-b-dashed py-1" style="font-size: ${es58mm ? '8.5px' : '10px'};">
        <div class="text-center font-black uppercase">${tituloComprobante}</div>
        <div class="text-center font-bold" style="font-size: ${es58mm ? '10px' : '12px'};">${venta?.numero || 'B001-000001'}</div>
        <div class="row-between" style="margin-top: 2px;">
          <span>FECHA:</span>
          <span class="font-bold">${fechaFormateada}</span>
        </div>
        <div class="row-between">
          <span>CAJERO:</span>
          <span class="font-bold truncate" style="max-width: ${es58mm ? '110px' : '160px'};">${venta?.usuario?.nombre || 'Dispensador'}</span>
        </div>
        <div class="row-between">
          <span>PAGO:</span>
          <span class="font-bold uppercase">${venta?.tipo_pago || 'Efectivo'}</span>
        </div>
        ${venta?.medico_cmp ? `
          <div class="row-between">
            <span>RECETA CMP:</span>
            <span class="font-bold">${venta.medico_cmp}</span>
          </div>
        ` : ''}
      </div>

      <!-- Datos Cliente -->
      <div class="border-b-dashed py-1" style="font-size: ${es58mm ? '8px' : '9.5px'};">
        <div class="row-between">
          <span>CLIENTE:</span>
          <span class="font-bold truncate text-right" style="max-width: ${es58mm ? '110px' : '160px'};">
            ${venta?.cliente?.nombre || 'CLIENTE VARIOS / PÚBLICO GENERAL'}
          </span>
        </div>
        ${venta?.cliente?.numero_documento ? `
          <div class="row-between">
            <span>${venta.cliente.tipo_documento || 'DOC'}:</span>
            <span class="font-bold">${venta.cliente.numero_documento}</span>
          </div>
        ` : ''}
      </div>

      <!-- Detalle Productos -->
      <div class="border-b-dashed py-1">
        <div class="row-between font-bold uppercase" style="font-size: ${es58mm ? '7.5px' : '9px'}; border-bottom: 1px dotted #888; padding-bottom: 2px; margin-bottom: 3px;">
          <span style="width: ${es58mm ? '20px' : '26px'};">CNT</span>
          <span style="flex: 1; padding: 0 3px;">DESCRIPCIÓN</span>
          <span style="width: ${es58mm ? '36px' : '45px'}; text-align: right;">TOTAL</span>
        </div>

        ${detalles.map((det) => `
          <div style="margin-bottom: 3px; font-size: ${es58mm ? '8px' : '9.5px'};">
            <div class="row-between font-bold">
              <span style="width: ${es58mm ? '20px' : '26px'};">${det.cantidad}${det.formato_venta === 'Fraccion' ? 'fr' : 'cj'}</span>
              <span style="flex: 1; padding: 0 3px; word-break: break-word;">${det.medicamento?.nombre_comercial || 'Medicamento'}</span>
              <span style="width: ${es58mm ? '36px' : '45px'}; text-align: right;">S/${parseFloat(det.subtotal || 0).toFixed(2)}</span>
            </div>
            <div style="font-size: ${es58mm ? '6.5px' : '7.5px'}; color: #444; padding-left: ${es58mm ? '20px' : '26px'};">
              Lt: ${det.lote?.numero_lote || 'FEFO'} | PU: S/${parseFloat(det.precio_unitario || 0).toFixed(2)}
            </div>
          </div>
        `).join('')}
      </div>

      <!-- Totales -->
      <div class="border-b-dashed py-1" style="font-size: ${es58mm ? '8px' : '9.5px'};">
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
        <div class="row-between font-black" style="font-size: ${es58mm ? '10px' : '12px'}; border-top: 1px solid #000; padding-top: 2px; margin-top: 2px;">
          <span>TOTAL:</span>
          <span>S/ ${totalNum.toFixed(2)}</span>
        </div>

        ${venta?.tipo_pago === 'Efectivo' ? `
          <div class="row-between" style="font-size: ${es58mm ? '7.5px' : '8.5px'}; margin-top: 2px;">
            <span>RECIBIDO:</span>
            <span>S/ ${recibidoNum.toFixed(2)}</span>
          </div>
          <div class="row-between font-bold" style="font-size: ${es58mm ? '8px' : '9px'};">
            <span>VUELTO:</span>
            <span>S/ ${vueltoNum.toFixed(2)}</span>
          </div>
        ` : ''}
      </div>

      <!-- Código QR SUNAT y Despedida -->
      <div class="text-center py-1">
        <div style="margin: 4px 0;">
          <img src="${qrUrl}" alt="QR" style="width: ${es58mm ? '70px' : '90px'}; height: ${es58mm ? '70px' : '90px'};" />
        </div>
        <div style="font-size: ${es58mm ? '6.5px' : '7.5px'}; text-transform: uppercase;">
          Representación Impresa de la ${tituloComprobante}
        </div>
        ${venta?.sunat_hash ? `
          <div style="font-size: 6px; word-break: break-all; color: #555; margin-top: 2px;">
            Hash: ${venta.sunat_hash}
          </div>
        ` : ''}
        <div style="font-size: ${es58mm ? '6.5px' : '7.5px'}; margin-top: 3px;">
          Consulte en www.sunat.gob.pe<br/>
          ¡Gracias por cuidar su salud con nosotros!
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Dispara la impresión física del comprobante en el formato seleccionado (80mm, 58mm o A4).
 * Emplea ventana emergente limpia de alta fidelidad o iframe aislado con dimensiones reales
 * para garantizar visualización inmediata sin hojas en blanco ni problemas de márgenes.
 */
export function imprimirTicketTermico(venta, { formato = '80mm', settings = {}, autoPrint = false } = {}) {
  const htmlContent = generarHtmlTicket(venta, formato, settings);

  // 1. MÉTODO PREFERIDO: Ventana emergente limpia dedicada
  // Garantiza que la vista previa de Chrome/Windows contenga única y exclusivamente el ticket
  try {
    const anchoWin = formato === 'A4' ? 840 : formato === '58mm' ? 340 : 420;
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
        // Enfoque inmediato en la ventana para que el usuario pueda visualizar el ticket con total claridad
        printWindow.focus();
      }
      return;
    }
  } catch (popupErr) {
    console.warn('Popup de impresión bloqueado, usando iframe seguro:', popupErr);
  }

  // 2. MÉTODO FALLBACK: Iframe con dimensiones reales en el DOM (no 0x0)
  try {
    let iframe = document.getElementById('print-ticket-engine-iframe');
    const anchoIframe = formato === 'A4' ? '210mm' : formato === '58mm' ? '58mm' : '80mm';

    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = 'print-ticket-engine-iframe';
      iframe.style.position = 'fixed';
      iframe.style.left = '0';
      iframe.style.top = '0';
      iframe.style.width = anchoIframe;
      iframe.style.height = '800px';
      iframe.style.zIndex = '-9999';
      iframe.style.opacity = '0.01'; // Permite que Chromium mantenga el render tree
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
        console.error('Fallo al imprimir desde iframe:', err);
      }
    }, 350);
  } catch (e) {
    console.error('Fallo en motor de impresión térmica:', e);
  }
}

/**
 * Genera el documento HTML especializado para el Cierre de Caja / Arqueo de Turno
 * adaptado a impresoras térmicas de 80mm y 58mm.
 */
export function generarHtmlTicketCierreCaja(cajaInfo, formato = '80mm', settings = {}) {
  const nombreBotica = escapeHtml(settings.businessName || 'BOTICA HEIS & SALUD');
  const rucBotica = escapeHtml(settings.businessRuc || '20608945123');
  const direccionBotica = escapeHtml(settings.address || 'Av. Las Palmas 450, San Isidro - Lima');
  const telefonoBotica = escapeHtml(settings.phone || '(01) 489-3210 / 998-765-432');
  const qfResponsable = escapeHtml(cajaInfo?.usuario?.colegiatura_qf
    ? `${cajaInfo?.usuario?.nombre || 'Director Técnico'} (${cajaInfo.usuario.colegiatura_qf})`
    : (settings.technicalDirector || 'Q.F. Responsable Reg. CQFP'));

  const fechaAperturaFmt = cajaInfo?.fecha_apertura
    ? new Date(cajaInfo.fecha_apertura).toLocaleString('es-PE', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
      })
    : '---';

  const fechaCierreFmt = cajaInfo?.fecha_cierre
    ? new Date(cajaInfo.fecha_cierre).toLocaleString('es-PE', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
      })
    : new Date().toLocaleString('es-PE', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
      });

  const fechaEmisionFmt = new Date().toLocaleString('es-PE', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  });

  const mInicial = parseFloat(cajaInfo?.monto_inicial || 0);
  const vEfectivo = parseFloat(cajaInfo?.ventas_efectivo ?? cajaInfo?.total_ventas_efectivo ?? 0);
  const vDigital = parseFloat(cajaInfo?.ventas_digitales ?? 0);
  const tVentas = parseFloat(cajaInfo?.total_ventas_general ?? (vEfectivo + vDigital));
  const cantVentas = cajaInfo?.cantidad_ventas ?? 0;
  const abonos = parseFloat(cajaInfo?.abonos_efectivo ?? 0);
  const ingExtra = parseFloat(cajaInfo?.ingresos_extra ?? 0);
  const egresos = parseFloat(cajaInfo?.total_egresos ?? 0);
  const sEsperado = parseFloat(cajaInfo?.monto_final_esperado ?? (mInicial + vEfectivo + abonos + ingExtra - egresos));
  const sReal = parseFloat(cajaInfo?.monto_final_real ?? cajaInfo?.monto_final ?? 0);
  const dif = parseFloat(cajaInfo?.diferencia !== undefined ? cajaInfo.diferencia : (sReal - sEsperado));

  let textoCuadre = 'ARQUEO EXACTO / SIN DIFERENCIAS';
  let badgeColor = '#047857'; // emerald
  if (dif > 0.01) {
    textoCuadre = `SOBRANTE DE CAJA: +S/ ${dif.toFixed(2)}`;
    badgeColor = '#1d4ed8'; // blue
  } else if (dif < -0.01) {
    textoCuadre = `FALTANTE DE CAJA: -S/ ${Math.abs(dif).toFixed(2)}`;
    badgeColor = '#b91c1c'; // red
  }

  const es58mm = formato === '58mm';

  const cssFormato = es58mm
    ? `
      @page { size: auto; margin: 0mm; }
      html, body {
        width: 52mm; max-width: 52mm; margin: 0 auto;
        padding: 1.5mm 1.5mm; font-family: 'Courier New', Courier, monospace;
        font-size: 9.5px; font-weight: 600; color: #000; background: #fff; line-height: 1.15;
        -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;
      }
    `
    : `
      @page { size: auto; margin: 0mm; }
      html, body {
        width: 76mm; max-width: 76mm; margin: 0 auto;
        padding: 2mm 2.5mm; font-family: 'Courier New', Courier, monospace;
        font-size: 11px; font-weight: 600; color: #000; background: #fff; line-height: 1.25;
        -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;
      }
    `;

  const movimientos = Array.isArray(cajaInfo?.movimientos) ? cajaInfo.movimientos : [];

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="utf-8" />
      <title>Cierre de Caja #${cajaInfo?.id || ''} - ${nombreBotica}</title>
      <style>
        ${cssFormato}
        * { box-sizing: border-box; }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .text-left { text-align: left; }
        .font-bold { font-weight: bold; }
        .font-black { font-weight: 900; }
        .uppercase { text-transform: uppercase; }
        .border-b-dashed { border-bottom: 1px dashed #000; }
        .border-t-dashed { border-top: 1px dashed #000; }
        .py-1 { padding-top: 3px; padding-bottom: 3px; }
        .py-2 { padding-top: 5px; padding-bottom: 5px; }
        .my-1 { margin-top: 3px; margin-bottom: 3px; }
        .row-between { display: flex; justify-content: space-between; align-items: flex-start; }
        .truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

        @media screen {
          html {
            background: #0f172a;
            min-height: 100vh;
            padding: 0;
            margin: 0;
          }
          body {
            background: #ffffff;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
            border: 1px solid #334155;
            border-radius: 8px;
            margin: 16px auto 32px auto !important;
          }
          .barra-control-print {
            position: sticky;
            top: 0;
            z-index: 9999;
            background: #1e293b;
            color: #ffffff;
            padding: 10px 16px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          }
          .barra-btn-print {
            background: #059669;
            color: #ffffff;
            font-weight: 800;
            font-size: 13px;
            padding: 8px 16px;
            border-radius: 8px;
            border: none;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            box-shadow: 0 2px 6px rgba(5, 150, 105, 0.3);
            transition: all 0.15s;
          }
          .barra-btn-print:hover {
            background: #047857;
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
            transition: background 0.15s;
          }
          .barra-btn-close:hover {
            background: #475569;
            color: #ffffff;
          }
        }
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
          }
        }
      </style>
    </head>
    <body>
      <!-- Barra Superior de Control (Visible en pantalla, Oculta en Impresión) -->
      <div class="no-print barra-control-print">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-weight: 900; font-size: 13px; letter-spacing: -0.2px;">🏥 CORTE DE CAJA</span>
          <span style="background: #059669; color: #fff; font-size: 10px; font-weight: 900; padding: 2px 7px; border-radius: 6px;">${formato}</span>
          <span style="color: #94a3b8; font-size: 11px; font-weight: 600;">TURNO #${cajaInfo?.id || 'ACTUAL'}</span>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <button type="button" onclick="window.print()" class="barra-btn-print">
            🖨️ IMPRIMIR CORTE
          </button>
          <button type="button" onclick="window.close()" class="barra-btn-close">
            Cerrar
          </button>
        </div>
      </div>

      <!-- Cabecera Botica -->
      <div class="text-center border-b-dashed py-1">
        <div class="font-black uppercase" style="font-size: ${es58mm ? '11px' : '13px'};">${nombreBotica}</div>
        <div class="font-bold">R.U.C. N° ${rucBotica}</div>
        <div style="font-size: ${es58mm ? '8px' : '9.5px'};">${direccionBotica}</div>
        <div style="font-size: ${es58mm ? '8px' : '9.5px'};">Telf: ${telefonoBotica}</div>
        <div class="font-bold" style="font-size: ${es58mm ? '8px' : '9px'}; margin-top: 2px;">${qfResponsable}</div>
      </div>

      <!-- Identificación de Cierre y Turno -->
      <div class="border-b-dashed py-1" style="font-size: ${es58mm ? '8.5px' : '10px'};">
        <div class="text-center font-black uppercase" style="font-size: ${es58mm ? '10px' : '11.5px'};">
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

      <!-- Resumen Financiero y Arqueo Matemático -->
      <div class="border-b-dashed py-1" style="font-size: ${es58mm ? '8.5px' : '10px'};">
        <div class="font-black text-center uppercase" style="margin-bottom: 3px; font-size: ${es58mm ? '9px' : '10.5px'};">
          -- CUADRE OPERATIVO --
        </div>
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
        <div class="row-between" style="font-size: ${es58mm ? '7.5px' : '8.5px'}; color: #444;">
          <span>  └ (Yape/Plin/POS)</span>
          <span>(en bancos)</span>
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
      <div class="border-b-dashed py-1" style="font-size: ${es58mm ? '9px' : '10.5px'};">
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

      <!-- Detalle de Movimientos si existen -->
      ${movimientos.length > 0 ? `
        <div class="border-b-dashed py-1" style="font-size: ${es58mm ? '8px' : '9px'};">
          <div class="font-black uppercase" style="margin-bottom: 2px;">
            MOVIMIENTOS DE CAJA CHICA (${movimientos.length}):
          </div>
          ${movimientos.map(m => `
            <div class="row-between" style="margin-bottom: 2px;">
              <span class="truncate" style="max-width: ${es58mm ? '100px' : '150px'};">
                ${m.tipo === 'Ingreso' ? '[+ING]' : '[-EGR]'} ${m.concepto || m.motivo || 'Movimiento'}
              </span>
              <span class="font-bold">S/ ${parseFloat(m.monto || 0).toFixed(2)}</span>
            </div>
          `).join('')}
        </div>
      ` : ''}

      <!-- Observaciones -->
      ${cajaInfo?.observaciones || cajaInfo?.observacion_usuario ? `
        <div class="border-b-dashed py-1" style="font-size: ${es58mm ? '8px' : '9px'};">
          <span class="font-bold">OBSERVACIONES:</span><br/>
          <span>${cajaInfo.observaciones || cajaInfo.observacion_usuario}</span>
        </div>
      ` : ''}

      <!-- Firmas de Conformidad -->
      <div class="py-2" style="font-size: ${es58mm ? '7.5px' : '8.5px'}; margin-top: 14px;">
        <div style="display: flex; justify-content: space-between; gap: 8px;">
          <div style="flex: 1; text-align: center;">
            <div style="border-top: 1px solid #000; margin-bottom: 2px;"></div>
            <span>ENTREGUÉ CONFORME</span><br/>
            <span class="font-bold">${cajaInfo?.usuario?.nombre || 'CAJERO'}</span>
          </div>
          <div style="flex: 1; text-align: center;">
            <div style="border-top: 1px solid #000; margin-bottom: 2px;"></div>
            <span>RECIBÍ CONFORME</span><br/>
            <span class="font-bold">ADMINISTRACIÓN / Q.F.</span>
          </div>
        </div>
      </div>

      <!-- Pie de Reporte -->
      <div class="text-center py-1" style="font-size: ${es58mm ? '7px' : '8px'}; color: #333; margin-top: 6px;">
        <div>Emisión: ${fechaEmisionFmt}</div>
        <div>Control Interno de Operaciones Farmacéuticas</div>
        <div class="font-bold" style="margin-top: 2px;">*** FIN DE REPORTE ***</div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Dispara la impresión térmica física del Cierre de Caja / Arqueo en el formato seleccionado (80mm o 58mm).
 */
export function imprimirTicketCierreCaja(cajaInfo, { formato = '80mm', settings = {}, autoPrint = true } = {}) {
  const htmlContent = generarHtmlTicketCierreCaja(cajaInfo, formato, settings);

  // 1. MÉTODO PREFERIDO: Ventana emergente limpia dedicada
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
            console.warn('Error en printWindow.print() de cierre:', err);
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
    console.warn('Popup de impresión de cierre bloqueado, usando iframe seguro:', popupErr);
  }

  // 2. MÉTODO FALLBACK: Iframe aislado
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
