import express from 'express';
import {
  createTransfer,
  getAllTransfers,
  getTransferById,
  updateTransfer,
  validateTransfer,
  cancelTransfer
} from '../controllers/transfer.controller.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getAllTransfers)
  .post(createTransfer);

router.route('/:id')
  .get(getTransferById)
  .put(updateTransfer);

router.post('/:id/validate', validateTransfer);
router.post('/:id/cancel', cancelTransfer);

export default router;
