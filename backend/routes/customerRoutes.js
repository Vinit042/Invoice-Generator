import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import {
  getCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from '../controllers/customerController.js';

const router = Router();

router.use(authMiddleware);

router.get('/', getCustomers);
router.get('/:id', getCustomer);
router.post('/', createCustomer);
router.put('/:id', updateCustomer);
router.delete('/:id', deleteCustomer);

export default router;
