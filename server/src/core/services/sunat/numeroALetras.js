/**
 * 🇵🇪 Conversor oficial de Números a Letras en Moneda Nacional (Soles)
 * Cumple con Catálogo N° 52 de SUNAT (Código 1000 - Monto expresado en letras)
 */

function unidades(num) {
  switch (num) {
    case 1: return 'UN';
    case 2: return 'DOS';
    case 3: return 'TRES';
    case 4: return 'CUATRO';
    case 5: return 'CINCO';
    case 6: return 'SEIS';
    case 7: return 'SIETE';
    case 8: return 'OCHO';
    case 9: return 'NUEVE';
    default: return '';
  }
}

function decenasY(strSin, numUnidades) {
  if (numUnidades > 0) {
    return strSin + ' Y ' + unidades(numUnidades);
  }
  return strSin;
}

function decenas(num) {
  const numDecenas = Math.floor(num / 10);
  const numUnidades = num - (numDecenas * 10);

  switch (numDecenas) {
    case 1:
      switch (numUnidades) {
        case 0: return 'DIEZ';
        case 1: return 'ONCE';
        case 2: return 'DOCE';
        case 3: return 'TRECE';
        case 4: return 'CATORCE';
        case 5: return 'QUINCE';
        default: return 'DIECI' + unidades(numUnidades);
      }
    case 2:
      switch (numUnidades) {
        case 0: return 'VEINTE';
        default: return 'VEINTI' + unidades(numUnidades);
      }
    case 3: return decenasY('TREINTA', numUnidades);
    case 4: return decenasY('CUARENTA', numUnidades);
    case 5: return decenasY('CINCUENTA', numUnidades);
    case 6: return decenasY('SESENTA', numUnidades);
    case 7: return decenasY('SETENTA', numUnidades);
    case 8: return decenasY('OCHENTA', numUnidades);
    case 9: return decenasY('NOVENTA', numUnidades);
    case 0: return unidades(numUnidades);
    default: return '';
  }
}

function centenas(num) {
  const numCentenas = Math.floor(num / 100);
  const numDecenas = num - (numCentenas * 100);

  switch (numCentenas) {
    case 1:
      if (numDecenas > 0) return 'CIENTO ' + decenas(numDecenas);
      return 'CIEN';
    case 2: return 'DOSCIENTOS ' + decenas(numDecenas);
    case 3: return 'TRESCIENTOS ' + decenas(numDecenas);
    case 4: return 'CUATROCIENTOS ' + decenas(numDecenas);
    case 5: return 'QUINIENTOS ' + decenas(numDecenas);
    case 6: return 'SEISCIENTOS ' + decenas(numDecenas);
    case 7: return 'SETECIENTOS ' + decenas(numDecenas);
    case 8: return 'OCHOCIENTOS ' + decenas(numDecenas);
    case 9: return 'NOVECIENTOS ' + decenas(numDecenas);
    default: return decenas(numDecenas);
  }
}

function miles(num) {
  const divisor = 1000;
  const cientos = Math.floor(num / divisor);
  const resto = num - (cientos * divisor);

  let strMiles = '';
  if (cientos === 1) {
    strMiles = 'UN MIL';
  } else if (cientos > 1) {
    strMiles = centenas(cientos) + ' MIL';
  }

  const strCentenas = centenas(resto);

  if (strMiles === '') return strCentenas;
  return (strMiles + ' ' + strCentenas).trim();
}

function millones(num) {
  const divisor = 1000000;
  const cientos = Math.floor(num / divisor);
  const resto = num - (cientos * divisor);

  let strMillones = '';
  if (cientos === 1) {
    strMillones = 'UN MILLON';
  } else if (cientos > 1) {
    strMillones = centenas(cientos) + ' MILLONES';
  }

  const strMiles = miles(resto);

  if (strMillones === '') return strMiles;
  return (strMillones + ' ' + strMiles).trim();
}

/**
 * Convierte un número decimal a texto en soles según norma SUNAT
 * @param {number|string} cantidad - Monto total
 * @param {string} moneda - Nombre de la moneda (por defecto SOLES)
 * @returns {string} Ejemplo: "SON: VEINTICINCO CON 00/100 SOLES"
 */
export function numeroALetras(cantidad, moneda = 'SOLES') {
  const num = parseFloat(cantidad) || 0;
  const entero = Math.floor(num);
  const centavos = Math.round((num - entero) * 100);
  const centavosStr = String(centavos).padStart(2, '0');

  let letrasEntero = '';
  if (entero === 0) {
    letrasEntero = 'CERO';
  } else {
    letrasEntero = millones(entero);
  }

  return `SON: ${letrasEntero.trim()} CON ${centavosStr}/100 ${moneda.toUpperCase()}`;
}

export default numeroALetras;
