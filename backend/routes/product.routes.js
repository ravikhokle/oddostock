import express from 'express';
import {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getLowStockProducts
} from '../controllers/product.controller.js';
import { protect } from '../middleware/auth.js';
import { 
  validateRequest, 
  createProductSchema, 
  updateProductSchema 
} from '../validators/product.validator.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getAllProducts)
  .post(validateRequest(createProductSchema), createProduct);

router.get('/low-stock', getLowStockProducts);

router.route('/:id')
  .get(getProductById)
  .put(validateRequest(updateProductSchema), updateProduct)
  .delete(deleteProduct);

export default router;
