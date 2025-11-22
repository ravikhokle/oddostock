import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { dashboardAPI } from '../services/api';
import toast from 'react-hot-toast';
import { Package, AlertTriangle, TruckIcon, Send, ArrowLeftRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { useSocket } from '../context/SocketContext';

const Dashboard = () => {
  const [kpis, setKpis] = useState(null);
  const [loading, setLoading] = useState(true);

  const [chartData, setChartData] = useState([]);
  const [chartPeriod, setChartPeriod] = useState('monthly');

  useEffect(() => {
    fetchDashboardData();
    fetchChartData(chartPeriod);
  }, []);

  // set up polling fallback for KPIs and charts
  useEffect(() => {
    const interval = setInterval(() => {
      fetchDashboardData();
      fetchChartData(chartPeriod);
    }, 15000); // refresh every 15 seconds

    return () => clearInterval(interval);
  }, [chartPeriod]);

  // listen to socket events to refresh immediately
  const socket = useSocket();
  useEffect(() => {
    if (!socket) return;

    const triggerRefresh = () => {
      fetchDashboardData();
      fetchChartData(chartPeriod);
    };

    socket.on('stock:updated', triggerRefresh);
    socket.on('receipt:created', triggerRefresh);
    socket.on('delivery:created', triggerRefresh);
    socket.on('transfer:created', triggerRefresh);
    socket.on('product:created', triggerRefresh);

    return () => {
      socket.off('stock:updated', triggerRefresh);
      socket.off('receipt:created', triggerRefresh);
      socket.off('delivery:created', triggerRefresh);
      socket.off('transfer:created', triggerRefresh);
      socket.off('product:created', triggerRefresh);
    };
  }, [socket, chartPeriod]);

  const fetchChartData = async (period = 'monthly') => {
    try {
      const res = await dashboardAPI.getSalesAndPurchaseChart({ period });
      setChartData(res.data.data || res.data);
    } catch (err) {
      // non-blocking
      console.warn('Failed to load chart data', err);
    }
  };

  const fetchDashboardData = async () => {
    try {
      const kpisRes = await dashboardAPI.getKPIs();
      setKpis(kpisRes.data.data);
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

  // Only keep the KPIs requested by the user
  const simpleStats = [
    { name: 'Total Products', value: kpis?.totalProducts || 0, icon: Package, color: 'bg-blue-500', bgColor: 'bg-blue-50', textColor: 'text-blue-600' },
    { name: 'Out - of - Stock', value: kpis?.outOfStockItems || 0, icon: AlertTriangle, color: 'bg-red-500', bgColor: 'bg-red-50', textColor: 'text-red-600' },
    { name: 'Pending Receipts', value: kpis?.pendingReceipts || 0, icon: TruckIcon, color: 'bg-yellow-500', bgColor: 'bg-yellow-50', textColor: 'text-yellow-600' },
    { name: 'Pending Deliveries', value: kpis?.pendingDeliveries || 0, icon: Send, color: 'bg-green-500', bgColor: 'bg-green-50', textColor: 'text-green-600' },
    { name: 'Scheduled Transfers', value: kpis?.scheduledTransfers || 0, icon: ArrowLeftRight, color: 'bg-purple-500', bgColor: 'bg-purple-50', textColor: 'text-purple-600' }
  ];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome to my website what's happening with your inventory today.</p>
        </div>

        {/* Simplified KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {simpleStats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.name} className="stat-card">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">{stat.name}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <div className={`${stat.bgColor} p-3 rounded-lg`}>
                    <Icon className={`w-6 h-6 ${stat.textColor}`} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Charts: Sales & Purchase and Order Summary */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Sales & Purchases</h2>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Period:</label>
              <select
                value={chartPeriod}
                onChange={(e) => {
                  setChartPeriod(e.target.value);
                  fetchChartData(e.target.value);
                }}
                className="border rounded px-2 py-1 text-sm"
              >
                <option value="monthly">Monthly (12 months)</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="purchases" fill="#8b5cf6" name="Purchases" />
                  <Bar dataKey="sales" fill="#3b82f6" name="Sales" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="card">
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="sales" stroke="#f59e0b" name="Sales" strokeWidth={2} />
                  <Line type="monotone" dataKey="purchases" stroke="#3b82f6" name="Purchases" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
