/**
 * Motor de Tarifas Dinámicas y Temporadas (Revenue Management Hotelero)
 * Evalúa multiplicadores de fin de semana, temporadas del año y descuentos por larga estancia.
 */

export const TEMPORADAS_PREDETERMINADAS = [
  { id: 'alta_verano', nombre: 'Temporada Alta (Verano & Año Nuevo)', inicioMesDia: '12-20', finMesDia: '03-15', recargo_pct: 20, activo: true },
  { id: 'fiestas_patrias', nombre: 'Fiestas Patrias Perú', inicioMesDia: '07-20', finMesDia: '08-05', recargo_pct: 35, activo: true },
  { id: 'semana_santa', nombre: 'Semana Santa & Feriados', inicioMesDia: '04-01', finMesDia: '04-15', recargo_pct: 25, activo: true },
  { id: 'temporada_baja', nombre: 'Temporada Baja Otoño', inicioMesDia: '05-01', finMesDia: '06-25', recargo_pct: -15, activo: false }
];

/**
 * Determina si una fecha (Date o string YYYY-MM-DD) cae dentro de un rango de temporada (formato MM-DD)
 */
export function estaEnTemporada(fecha, inicioMesDia, finMesDia) {
  const d = new Date(fecha);
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  const actualMD = `${mes}-${dia}`;

  if (inicioMesDia <= finMesDia) {
    // Mismo año (ej: 07-20 a 08-05)
    return actualMD >= inicioMesDia && actualMD <= finMesDia;
  } else {
    // Cruza año nuevo (ej: 12-20 a 03-15)
    return actualMD >= inicioMesDia || actualMD <= finMesDia;
  }
}

/**
 * Calcula la tarifa dinámica noche por noche
 * @param {Object} params
 * @param {number} params.precioBase - Tarifa base de la habitación
 * @param {Date|string} params.fechaEntrada - Fecha de check-in
 * @param {number} params.noches - Número de noches
 * @param {Object} params.config - Configuración de tarifas
 */
export function calcularTarifaDinamica({
  precioBase = 80,
  fechaEntrada = new Date(),
  noches = 1,
  config = {}
}) {
  const base = parseFloat(precioBase) || 80;
  const numNoches = Math.max(1, parseInt(noches, 10) || 1);

  // Configuración de reglas
  const finSemanaActivo = config.tarifas_fin_de_semana_activo !== 'false' && config.tarifas_fin_de_semana_activo !== false;
  const finSemanaPct = parseFloat(config.tarifas_fin_de_semana_recargo || 15);
  const desc3NochesPct = parseFloat(config.tarifas_descuento_larga_estancia_3_noches || 10);
  const desc7NochesPct = parseFloat(config.tarifas_descuento_larga_estancia_7_noches || 15);

  let temporadas = TEMPORADAS_PREDETERMINADAS;
  if (config.tarifas_temporadas) {
    try {
      const parsed = typeof config.tarifas_temporadas === 'string'
        ? JSON.parse(config.tarifas_temporadas)
        : config.tarifas_temporadas;
      if (Array.isArray(parsed) && parsed.length > 0) {
        temporadas = parsed;
      }
    } catch (_) {}
  }

  const startDate = new Date(fechaEntrada);
  let totalSinDescuento = 0;
  const desgloseNoches = [];
  let temporadasAplicadas = new Set();
  let nochesFinDeSemana = 0;

  for (let i = 0; i < numNoches; i++) {
    const fechaNoche = new Date(startDate.getTime() + i * 86400000);
    const diaSemana = fechaNoche.getDay(); // 0: Dom, 5: Vie, 6: Sab
    const esFinSemana = diaSemana === 5 || diaSemana === 6; // Viernes o Sábado

    let factorNoche = 1.0;
    let motivoNoche = 'Tarifa Regular';

    // 1. Temporadas
    const tempActiva = temporadas.find(t => t.activo && estaEnTemporada(fechaNoche, t.inicioMesDia, t.finMesDia));
    if (tempActiva) {
      const pct = (parseFloat(tempActiva.recargo_pct) || 0) / 100;
      factorNoche += pct;
      temporadasAplicadas.add(tempActiva.nombre);
      motivoNoche = tempActiva.nombre;
    }

    // 2. Multiplicador de Fin de Semana
    if (esFinSemana && finSemanaActivo) {
      factorNoche += (finSemanaPct / 100);
      nochesFinDeSemana++;
      motivoNoche += ' + Fin de Semana';
    }

    const precioNocheCalculado = +(base * factorNoche).toFixed(2);
    totalSinDescuento += precioNocheCalculado;

    desgloseNoches.push({
      fecha: fechaNoche.toISOString().split('T')[0],
      dia: diaSemana === 5 ? 'Viernes' : diaSemana === 6 ? 'Sábado' : 'Semana',
      esFinSemana,
      precio: precioNocheCalculado,
      motivo: motivoNoche
    });
  }

  // 3. Descuento por Larga Estancia
  let descuentoPct = 0;
  let motivoDescuento = null;
  if (numNoches >= 7 && desc7NochesPct > 0) {
    descuentoPct = desc7NochesPct;
    motivoDescuento = `Descuento Semanal 7+ noches (-${desc7NochesPct}%)`;
  } else if (numNoches >= 3 && desc3NochesPct > 0) {
    descuentoPct = desc3NochesPct;
    motivoDescuento = `Descuento Larga Estadía 3+ noches (-${desc3NochesPct}%)`;
  }

  const montoDescuento = +(totalSinDescuento * (descuentoPct / 100)).toFixed(2);
  const totalFinal = Math.max(0, +(totalSinDescuento - montoDescuento).toFixed(2));
  const precioPromedioNoche = +(totalFinal / numNoches).toFixed(2);

  return {
    precioBase: base,
    noches: numNoches,
    precioPromedioNoche,
    totalSinDescuento: +totalSinDescuento.toFixed(2),
    descuentoPct,
    montoDescuento,
    motivoDescuento,
    totalFinal,
    nochesFinDeSemana,
    temporadasAplicadas: Array.from(temporadasAplicadas),
    desgloseNoches,
    esTarifaDinamica: totalFinal !== +(base * numNoches).toFixed(2)
  };
}

