import { Router } from 'express';
import { getPublicInvoice } from '../controllers/settingsController.js';

const router = Router();

router.get('/invoice/:invoiceNumber', getPublicInvoice);

export default router;
