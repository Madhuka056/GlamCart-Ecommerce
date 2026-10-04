import express from 'express';
import { protect } from '../middleware/auth.js';
import { startPayment, handleNotify } from '../controllers/payhereController.js';

const router = express.Router();

router.post('/start', protect, startPayment);
router.post('/notify', handleNotify); // PayHere server eken, protect danna epa

export default router;