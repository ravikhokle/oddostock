import express from 'express';
import {
  createDelivery,
  getAllDeliveries,
  getDeliveryById,
  updateDelivery,
  pickItems,
  packItems,
  validateDelivery,
  cancelDelivery
} from '../controllers/delivery.controller.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getAllDeliveries)
  .post(createDelivery);

router.route('/:id')
  .get(getDeliveryById)
  .put(updateDelivery);

router.post('/:id/pick', pickItems);
router.post('/:id/pack', packItems);
router.post('/:id/validate', validateDelivery);
router.post('/:id/cancel', cancelDelivery);

export default router;
