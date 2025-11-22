import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { dashboardAPI } from '../services/api';
import toast from 'react-hot-toast';
import {
  Package,
  AlertTriangle,
  TruckIcon,
  Send,
  ArrowLeftRight,
  DollarSign,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

const Dashboard = () => {
  const [kpis, setKpis] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [kpisRes, chartRes] = await Promise.all([
        dashboardAPI.getKPIs(),
        dashboardAPI.getSalesAndPurchaseChart()
      ]);

      setKpis(kpisRes.data.data);
      setChartData(chartRes.data.data);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      </Layout>
    );
  }

  const stats = [
    {
      name: 'Total Products',
      value: kpis?.totalProducts || 0,
      icon: Package,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600'
    },
    {
      name: 'Sales',
      value: `₹ ${(kpis?.sales?.totalRevenue || 0).toLocaleString()}`,
      icon: TrendingUp,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
      subtitle: `${kpis?.sales?.totalSales || 0} orders`
    },
    {
      name: 'Revenue',
      value: `₹ ${(kpis?.purchase?.totalCost || 0).toLocaleString()}`,
      icon: DollarSign,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
      subtitle: `${kpis?.purchase?.totalPurchases || 0} receipts`
    },
    {
      name: 'Profit',
      value: `₹ ${(kpis?.profit || 0).toLocaleString()}`,
      icon: TrendingUp,
      color: 'bg-orange-500',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-600'
    },
    {
      name: 'Stock Value',
      value: `₹ ${(kpis?.stockValue || 0).toLocaleString()}`,
      icon: Package,
      color: 'bg-indigo-500',
      bgColor: 'bg-indigo-50',
      textColor: 'text-indigo-600'
    }
  ];

  const operationStats = [
    {
      name: 'Pending Receipts',
      value: kpis?.pendingReceipts || 0,
      icon: TruckIcon,
      color: 'bg-blue-500',
      href: '/receipts?status=waiting'
    },
    {
      name: 'Low Stock Items',
      value: kpis?.lowStockItems || 0,
      icon: AlertTriangle,
      color: 'bg-yellow-500',
      href: '/products?filter=low-stock'
    },
    {
      name: 'Pending Deliveries',
      value: kpis?.pendingDeliveries || 0,
      icon: Send,
      color: 'bg-green-500',
      href: '/deliveries?status=waiting'
    },
    {
      name: 'Internal Transfers',
      value: kpis?.scheduledTransfers || 0,
      icon: ArrowLeftRight,
      color: 'bg-purple-500',
      href: '/transfers?status=waiting'
    }
  ];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back! Here's what's happening with your inventory today.</p>
        </div>

        {/* Sales Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.name} className="stat-card">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">{stat.name}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    {stat.subtitle && (
                      <p className="text-xs text-gray-500 mt-1">{stat.subtitle}</p>
                    )}
                  </div>
                  <div className={`${stat.bgColor} p-3 rounded-lg`}>
                    <Icon className={`w-6 h-6 ${stat.textColor}`} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Operations Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {operationStats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.name} className="stat-card cursor-pointer hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-4">
                  <div className={`${stat.color} p-3 rounded-lg`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                    <p className="text-sm text-gray-600">{stat.name}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sales & Purchase Chart */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales & Purchase</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="purchases" fill="#8b5cf6" name="Purchase" />
                <Bar dataKey="sales" fill="#3b82f6" name="Sales" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Order Summary */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="sales" stroke="#f59e0b" name="Ordered" />
                <Line type="monotone" dataKey="purchases" stroke="#3b82f6" name="Delivered" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activities</h3>
          <div className="space-y-3">
            {kpis?.recentActivities?.slice(0, 5).map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                    <Package className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {activity.transactionType.replace('_', ' ').toUpperCase()}
                    </p>
                    <p className="text-xs text-gray-500">
                      {activity.product?.name} - {activity.quantity > 0 ? '+' : ''}{activity.quantity} units
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">{activity.warehouse?.name}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(activity.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
