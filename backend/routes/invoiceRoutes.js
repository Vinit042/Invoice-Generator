import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import {
  getInvoices,
  getInvoice,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  getDashboardStats,
  getNextInvoiceNumber,
} from '../controllers/invoiceController.js';

const router = Router();

router.use(authMiddleware);

router.get('/dashboard/stats', getDashboardStats);
router.get('/next-number', getNextInvoiceNumber);
router.get('/', getInvoices);
router.get('/:id', getInvoice);
router.post('/', createInvoice);
router.put('/:id', updateInvoice);
router.delete('/:id', deleteInvoice);

export default router;
