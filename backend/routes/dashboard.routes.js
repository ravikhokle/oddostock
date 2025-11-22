import express from 'express';
import {
  getDashboardKPIs,
  getInventorySummary,
  getSalesAndPurchaseChart
} from '../controllers/dashboard.controller.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/kpis', getDashboardKPIs);
router.get('/inventory-summary', getInventorySummary);
router.get('/sales-purchase-chart', getSalesAndPurchaseChart);

export default router;
