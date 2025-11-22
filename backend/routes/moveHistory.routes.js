import express from 'express';
import {
  getMoveHistory,
  getProductMoveHistory
} from '../controllers/moveHistory.controller.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/', getMoveHistory);
router.get('/product/:productId', getProductMoveHistory);

export default router;
