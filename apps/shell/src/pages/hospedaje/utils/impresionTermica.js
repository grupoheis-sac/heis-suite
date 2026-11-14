/**
 * impresionTermica.js — Motor de Impresión Térmica ESC/POS para Hospedaje y Hotelería
 * 
 * Formatos soportados:
 * - '80mm': Rollo térmico estándar de recepción / POS (ancho 76-80mm)
 * - '58mm': Rollo térmico compacto / mini impresora Bluetooth (ancho 50-54mm)
 */

/**
 * Escapa caracteres HTML peligrosos para prevenir XSS en el documento de impresión.
 * Todos los valores provenientes de datos del usuario/servidor deben pasar por aquí.
 * @param {any} value
 * @returns {string}
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
export { escapeHtml as escHtml };

export function generarHtmlTicketCierreCaja(cajaInfo, formato = '80mm', settings = {}) {
  const nombreHotel = escapeHtml(settings.businessName || 'GRAND HOTEL & SUITES');
  const rucHotel = escapeHtml(settings.businessRuc || '20491823711');
  const direccionHotel = escapeHtml(settings.address || 'Av. Larco 1050, Miraflores, Lima - Perú');
  const telefonoHotel = escapeHtml(settings.phone || '(01) 489-3210 / 998-765-432');

  const es58mm = formato === '58mm';

  // Datos financieros y arqueo
  const mInicial = parseFloat(cajaInfo?.monto_apertura ?? cajaInfo?.monto_inicial ?? 0);
  
  // Analizar resumen_metodos si viene serializado
  let resumenObj = {};
  if (typeof cajaInfo?.resumen_metodos === 'string') {
    try {
      resumenObj = JSON.parse(cajaInfo.resumen_metodos);
    } catch (_) {}
  } else if (typeof cajaInfo?.resumen_metodos === 'object') {
    resumenObj = cajaInfo.resumen_metodos || {};
  }

  const vEfectivo = parseFloat(
    resumenObj.pagos_efectivo ??
    cajaInfo?.ventas_efectivo ??
    cajaInfo?.total_ventas_efectivo ??
    0
  );
  const vDigital = parseFloat(
    resumenObj.total_digital ??
    cajaInfo?.ventas_digitales ??
    0
  );
  const ingExtra = parseFloat(
    resumenObj.ingresos_manuales_efectivo ??
    cajaInfo?.ingresos_extra ??
    0
  );
  const egresos = parseFloat(
    resumenObj.egresos_efectivo ??
    cajaInfo?.total_egresos ??
    0
  );
  
  const sEsperado = parseFloat(
    cajaInfo?.monto_cierre_esperado ??
    cajaInfo?.monto_final_esperado ??
    (mInicial + vEfectivo + ingExtra - egresos)
  );
  const sReal = parseFloat(
    cajaInfo?.monto_cierre_real ??
    cajaInfo?.monto_final_real ??
    cajaInfo?.monto_final ??
    0
  );
  const dif = parseFloat(
    cajaInfo?.diferencia !== undefined
      ? cajaInfo.diferencia
      : (sReal - sEsperado)
  );

  const esCuadrado = Math.abs(dif) < 0.01;
  const esSobrante = dif > 0.01;
  const esFaltante = dif < -0.01;

  let textoCuadre = '✅ CUADRE PERFECTO (0.00)';
  if (esSobrante) textoCuadre = `⚠️ SOBRANTE: +S/ ${dif.toFixed(2)}`;
  if (esFaltante) textoCuadre = `❌ FALTANTE: -S/ ${Math.abs(dif).toFixed(2)}`;

  const fechaAperturaFmt = cajaInfo?.fecha_apertura
    ? new Date(cajaInfo.fecha_apertura).toLocaleString('es-PE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : '-';

  const fechaCierreFmt = cajaInfo?.fecha_cierre
    ? new Date(cajaInfo.fecha_cierre).toLocaleString('es-PE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : new Date().toLocaleString('es-PE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

  const fechaEmisionFmt = new Date().toLocaleString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>Cierre_Caja_Turno_${cajaInfo?.id || 'Actual'}</title>
      <style>
        @page {
          size: ${es58mm ? '58mm' : '80mm'} auto;
          margin: 0;
        }
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        body {
          font-family: 'Courier New', Courier, monospace;
          background: #fff;
          color: #000;
          width: ${es58mm ? '54mm' : '72mm'};
          max-width: ${es58mm ? '54mm' : '72mm'};
          margin: 0 auto;
          padding: ${es58mm ? '3mm 1mm' : '4mm 2mm'};
          font-size: ${es58mm ? '9px' : '10.5px'};
          line-height: 1.25;
        }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .font-bold { font-weight: bold; }
        .font-black { font-weight: 900; }
        .uppercase { text-transform: uppercase; }
        .border-b-dashed { border-bottom: 1px dashed #000; }
        .py-1 { padding-top: 3px; padding-bottom: 3px; }
        .py-2 { padding-top: 6px; padding-bottom: 6px; }
        .row-between {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
        }
        .truncate {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .barra-control-print {
          position: sticky;
          top: 0;
          background: #0f172a;
          color: #fff;
          padding: 8px 12px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
          border-radius: 6px;
          font-family: system-ui, -apple-system, sans-serif;
        }
        .barra-btn-print {
          background: #2563eb;
          color: #fff;
          border: none;
          padding: 4px 10px;
          border-radius: 4px;
          font-weight: 700;
          font-size: 11px;
          cursor: pointer;
        }
        .barra-btn-close {
          background: #334155;
          color: #cbd5e1;
          border: none;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 11px;
          cursor: pointer;
        }
        @media print {
          .no-print { display: none !important; }
          body { width: 100% !important; max-width: 100% !important; padding: 0 !important; margin: 0 !important; }
        }
      </style>
    </head>
    <body>
      <!-- Barra Superior de Control -->
      <div class="no-print barra-control-print">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-weight: 900; font-size: 13px;">🏨 CORTE DE CAJA</span>
          <span style="background: #2563eb; color: #fff; font-size: 10px; font-weight: 900; padding: 2px 7px; border-radius: 6px;">${formato}</span>
          <span style="color: #94a3b8; font-size: 11px; font-weight: 600;">TURNO #${cajaInfo?.id || 'ACTUAL'}</span>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <button type="button" onclick="window.print()" class="barra-btn-print">
            🖨️ IMPRIMIR
          </button>
          <button type="button" onclick="window.close()" class="barra-btn-close">
            Cerrar
          </button>
        </div>
      </div>

      <!-- Cabecera Hotel -->
      <div class="text-center border-b-dashed py-1">
        <div class="font-black uppercase" style="font-size: ${es58mm ? '11px' : '13px'};">${nombreHotel}</div>
        <div class="font-bold">R.U.C. N° ${rucHotel}</div>
        <div style="font-size: ${es58mm ? '8px' : '9.5px'};">${direccionHotel}</div>
        <div style="font-size: ${es58mm ? '8px' : '9.5px'};">Telf: ${telefonoHotel}</div>
        <div class="font-bold" style="font-size: ${es58mm ? '8px' : '9px'}; margin-top: 2px;">RECEPCIÓN & CAJA PRINCIPAL</div>
      </div>

      <!-- Identificación de Cierre y Turno -->
      <div class="border-b-dashed py-1" style="font-size: ${es58mm ? '8.5px' : '10px'};">
        <div class="text-center font-black uppercase" style="font-size: ${es58mm ? '10px' : '11.5px'};">
          *** CORTE Y ARQUEO DE TURNO ***
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
          <span>RESPONSABLE:</span>
          <span class="font-bold truncate" style="max-width: ${es58mm ? '110px' : '160px'};">
            ${escHtml(cajaInfo?.usuario?.nombre || cajaInfo?.usuario?.name || 'Recepción')}
          </span>
        </div>
      </div>

      <!-- Resumen Financiero y Cuadre -->
      <div class="border-b-dashed py-1" style="font-size: ${es58mm ? '8.5px' : '10px'};">
        <div class="font-black text-center uppercase" style="margin-bottom: 3px; font-size: ${es58mm ? '9px' : '10.5px'};">
          -- CUADRE OPERATIVO --
        </div>
        <div class="row-between">
          <span>(+) FONDO INICIAL:</span>
          <span class="font-bold">S/ ${mInicial.toFixed(2)}</span>
        </div>
        <div class="row-between">
          <span>(+) COBROS EFECTIVO:</span>
          <span class="font-bold">S/ ${vEfectivo.toFixed(2)}</span>
        </div>
        <div class="row-between">
          <span>(+) COBROS DIGITALES:</span>
          <span class="font-bold">S/ ${vDigital.toFixed(2)}</span>
        </div>
        <div class="row-between" style="font-size: ${es58mm ? '7.5px' : '8.5px'}; color: #444;">
          <span>  └ (Yape/Plin/POS/Transf)</span>
          <span>(en bancos)</span>
        </div>
        ${ingExtra > 0 ? `
          <div class="row-between">
            <span>(+) INGRESOS MANUALES:</span>
            <span class="font-bold">S/ ${ingExtra.toFixed(2)}</span>
          </div>
        ` : ''}
        ${egresos > 0 ? `
          <div class="row-between">
            <span>(-) GASTOS / SALIDAS:</span>
            <span class="font-bold">S/ ${egresos.toFixed(2)}</span>
          </div>
        ` : ''}
        <div class="row-between font-bold" style="border-top: 1px dotted #888; margin-top: 3px; padding-top: 2px;">
          <span>TOTAL INGRESOS TURNO:</span>
          <span>S/ ${(vEfectivo + vDigital + ingExtra).toFixed(2)}</span>
        </div>
      </div>

      <!-- Balance Físico y Diferencia -->
      <div class="border-b-dashed py-1" style="font-size: ${es58mm ? '9px' : '10.5px'};">
        <div class="row-between">
          <span>SALDO ESPERADO CAJÓN:</span>
          <span class="font-bold">S/ ${sEsperado.toFixed(2)}</span>
        </div>
        <div class="row-between font-black" style="font-size: ${es58mm ? '10px' : '11.5px'};">
          <span>EFECTIVO REAL CONTADO:</span>
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

      <!-- Observaciones si existen -->
      ${cajaInfo?.observaciones_cierre || cajaInfo?.observaciones ? `
        <div class="border-b-dashed py-1" style="font-size: ${es58mm ? '8px' : '9px'};">
          <span class="font-bold">NOTAS:</span><br/>
          <span>${escHtml(cajaInfo.observaciones_cierre || cajaInfo.observaciones)}</span>
        </div>
      ` : ''}

      <!-- Firmas de Recepción y Administración -->
      <div class="py-2" style="font-size: ${es58mm ? '7.5px' : '8.5px'}; margin-top: 14px;">
        <div style="display: flex; justify-content: space-between; gap: 8px;">
          <div style="flex: 1; text-align: center;">
            <div style="border-top: 1px solid #000; margin-bottom: 2px;"></div>
            <span>ENTREGUÉ CONFORME</span><br/>
            <span class="font-bold">${escHtml(cajaInfo?.usuario?.nombre || cajaInfo?.usuario?.name || 'RECEPCIÓN')}</span>
          </div>
          <div style="flex: 1; text-align: center;">
            <div style="border-top: 1px solid #000; margin-bottom: 2px;"></div>
            <span>RECIBÍ CONFORME</span><br/>
            <span class="font-bold">ADMINISTRACIÓN</span>
          </div>
        </div>
      </div>

      <!-- Pie de Reporte -->
      <div class="text-center py-1" style="font-size: ${es58mm ? '7px' : '8px'}; color: #333; margin-top: 6px;">
        <div>Emisión: ${fechaEmisionFmt}</div>
        <div>Control Interno de Gestión Hotelera</div>
        <div class="font-bold" style="margin-top: 2px;">*** FIN DE REPORTE ***</div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Dispara la impresión térmica del arqueo/cierre de caja
 */
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
 * Genera el documento HTML completo para comprobantes de hospedaje / tickets térmicos
 * Soporta rollos térmicos de 80mm y 58mm.
 */
export function generarHtmlTicket(venta, formato = '80mm', settings = {}) {
  const nombreHotel = settings.businessName || 'GRAND HOTEL & SUITES';
  const rucHotel = settings.businessRuc || '20491823711';
  const direccionHotel = settings.address || 'Av. Larco 1050, Miraflores, Lima - Perú';
  const telefonoHotel = settings.phone || '(01) 489-3210 / 998-765-432';

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
      : 'TICKET DE HOSPEDAJE';

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
    `${rucHotel}|${codTipoSunat}|${venta?.serie || 'B001'}|${venta?.numero || '000001'}|${igvNum.toFixed(2)}|${totalNum.toFixed(2)}|${fechaFormateada.split(',')[0]}|${docTipoCliente}|${venta?.cliente?.numero_documento || '00000000'}|${venta?.sunat_hash || ''}|`;

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
      <title>${tituloComprobante} - ${venta?.numero || 'Ticket'} - ${nombreHotel}</title>
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
          ${nombreHotel}
        </h2>
        <p class="font-bold">R.U.C. N° ${rucHotel}</p>
        <p style="font-size: ${es58mm ? '7.5px' : '8.5px'};">${direccionHotel}</p>
        <p style="font-size: ${es58mm ? '7.5px' : '8.5px'};">Telf: ${telefonoHotel}</p>
        ${settings.minceturCodigoRegistro ? `<p style="font-size: ${es58mm ? '7px' : '8px'}; color: #333;">DIRCETUR: ${settings.minceturCodigoRegistro}</p>` : ''}
      </div>

      <div class="border-dashed"></div>

      <div class="text-center font-bold">
        <p class="font-black" style="font-size: ${es58mm ? '10px' : '12px'};">${tituloComprobante}</p>
        <p class="font-black" style="font-size: ${es58mm ? '11px' : '13px'};">${venta?.numero || 'B001-000001'}</p>
      </div>

      <div class="border-dashed"></div>

      <div>
        <p><strong>FECHA:</strong> ${escHtml(fechaFormateada)}</p>
        <p><strong>HUÉSPED / CLIENTE:</strong> ${escHtml(venta?.cliente?.nombre || 'PÚBLICO GENERAL / HUÉSPED')}</p>
        ${venta?.cliente?.numero_documento ? `<p><strong>${escHtml(venta.cliente.tipo_documento || 'DOC')}:</strong> ${escHtml(venta.cliente.numero_documento)}</p>` : ''}
        ${venta?.habitacion ? `<p><strong>HABITACIÓN:</strong> Hab. ${escHtml(venta.habitacion)}</p>` : ''}
        <p><strong>FORMA DE PAGO:</strong> ${escHtml(venta?.tipo_pago || 'Efectivo')}</p>
        ${venta?.numero_operacion ? `<p><strong>N° OPERACIÓN:</strong> ${escHtml(venta.numero_operacion)}</p>` : ''}
      </div>

      <div class="border-dashed"></div>

      <!-- Detalle de Servicios y Consumos -->
      <div>
        <div class="row-between font-bold" style="font-size: ${es58mm ? '8px' : '9px'};">
          <span>DESCRIPCIÓN / SERVICIO</span>
          <span>TOTAL</span>
        </div>
        <div class="border-dashed"></div>
        ${detalles.map((det) => {
          const prodNom = escHtml(det.producto?.nombre || det.nombre || 'Servicio de Hospedaje');
          const cant = det.cantidad || 1;
          const precio = parseFloat(det.precio_unitario || det.precio || 0);
          const sub = parseFloat(det.subtotal || cant * precio);
          const unid = escHtml(det.producto?.unidad_medida || det.unidad_medida || 'SRV');

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
        <p style="font-size: 7.5px; margin-top: 3px;">${settings.ticketFooterText || '¡Gracias por su estadía! Que tenga un feliz viaje.'}</p>
      </div>
    </body>
    </html>
  `;
}

/**
 * Dispara la impresión física del comprobante de hospedaje / venta en 80mm o 58mm.
 */
export function imprimirTicketTermico(venta, { formato = '80mm', settings = {}, autoPrint = true } = {}) {
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

