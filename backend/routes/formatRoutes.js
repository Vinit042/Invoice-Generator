import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import {
  getFormats,
  getFormat,
  createFormat,
  updateFormat,
  deleteFormat,
} from '../controllers/formatController.js';

const router = Router();

router.use(authMiddleware);

router.get('/', getFormats);
router.get('/:id', getFormat);
router.post('/', createFormat);
router.put('/:id', updateFormat);
router.delete('/:id', deleteFormat);

export default router;
