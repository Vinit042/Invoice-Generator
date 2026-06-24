import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { upload } from '../config/upload.js';
import { getSettings, updateSettings } from '../controllers/settingsController.js';

const router = Router();

router.use(authMiddleware);

router.get('/', getSettings);
router.put(
  '/',
  upload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'signature', maxCount: 1 },
  ]),
  updateSettings
);

export default router;
