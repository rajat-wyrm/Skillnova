import { Router } from 'express';
import * as skillGap from '../controllers/skillGap.controller.js';

const router = Router();

router.get('/metadata', skillGap.metadata);
router.get('/roles', skillGap.roles);
router.post('/analyze', skillGap.analyze);

export default router;
