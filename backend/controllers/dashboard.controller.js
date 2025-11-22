import dashboardService from '../services/dashboard.service.js';

export const getDashboardKPIs = async (req, res, next) => {
  try {
    const kpis = await dashboardService.getDashboardKPIs(req.query);
    res.status(200).json({
      success: true,
      data: kpis
    });
  } catch (error) {
    next(error);
  }
};

export const getInventorySummary = async (req, res, next) => {
  try {
    const summary = await dashboardService.getInventorySummary();
    res.status(200).json({
      success: true,
      data: summary
    });
  } catch (error) {
    next(error);
  }
};

export const getSalesAndPurchaseChart = async (req, res, next) => {
  try {
    const data = await dashboardService.getSalesAndPurchaseChart(req.query.period);
    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
};
