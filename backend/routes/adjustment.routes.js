import express from 'express';
import {
  createAdjustment,
  getAllAdjustments,
  getAdjustmentById,
  updateAdjustment,
  validateAdjustment,
  cancelAdjustment
} from '../controllers/adjustment.controller.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getAllAdjustments)
  .post(createAdjustment);

router.route('/:id')
  .get(getAdjustmentById)
  .put(updateAdjustment);

router.post('/:id/validate', validateAdjustment);
router.post('/:id/cancel', cancelAdjustment);

export default router;
