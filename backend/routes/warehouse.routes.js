import express from 'express';
import {
  createWarehouse,
  getAllWarehouses,
  getWarehouseById,
  updateWarehouse,
  deleteWarehouse,
  createLocation,
  getLocationsByWarehouse
} from '../controllers/warehouse.controller.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getAllWarehouses)
  .post(createWarehouse);

router.route('/:id')
  .get(getWarehouseById)
  .put(updateWarehouse)
  .delete(deleteWarehouse);

router.post('/locations', createLocation);
router.get('/:warehouseId/locations', getLocationsByWarehouse);

export default router;
