/**
 * index.js — Barrel de componentes POS
 * Exporta todos los sub-componentes del módulo POS para importación limpia (P14)
 * Uso: import { POSCatalogo, POSTicket, POSModalDCI, POSModalPaciente, POSModalAtajos } from '../components/pos'
 */
export { default as POSCatalogo } from './POSCatalogo';
export { default as POSTicket } from './POSTicket';
export { default as POSModalDCI } from './POSModalDCI';
export { default as POSModalPaciente } from './POSModalPaciente';
export { default as POSModalAtajos } from './POSModalAtajos';
