import { Router } from 'express';
import { consultarDocumento } from '../controllers/consulta.controller.js';

const router = Router();

// Endpoint público para autocompletar RUC / DNI en onboarding, POS y SuperAdmin
router.get('/:tipo/:numero', consultarDocumento);

export default router;

