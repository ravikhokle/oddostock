import express from 'express';
import {
  createReceipt,
  getAllReceipts,
  getReceiptById,
  updateReceipt,
  validateReceipt,
  cancelReceipt
} from '../controllers/receipt.controller.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getAllReceipts)
  .post(createReceipt);

router.route('/:id')
  .get(getReceiptById)
  .put(updateReceipt);

router.post('/:id/validate', validateReceipt);
router.post('/:id/cancel', cancelReceipt);

export default router;
