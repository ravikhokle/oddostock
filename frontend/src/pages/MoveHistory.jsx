import { useEffect, useState } from 'react';
import { Search, Filter, Download, ArrowUpRight, ArrowDownRight, Package, Calendar } from 'lucide-react';
import Layout from '../components/Layout';
import { moveHistoryAPI, productAPI, warehouseAPI } from '../services/api';
import toast from 'react-hot-toast';

const MoveHistory = () => {
  const [history, setHistory] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState({
    product: '',
    warehouse: '',
    location: '',
    transactionType: '',
    startDate: '',
    endDate: ''
  });

  const transactionTypes = [
    { value: '', label: 'All Types' },
    { value: 'receipt', label: 'Receipt' },
    { value: 'delivery', label: 'Delivery' },
    { value: 'transfer_in', label: 'Transfer In' },
    { value: 'transfer_out', label: 'Transfer Out' },
    { value: 'adjustment', label: 'Adjustment' }
  ];

  useEffect(() => {
    fetchHistory();
    fetchProducts();
    fetchWarehouses();
  }, []);

  const fetchHistory = async () => {
    try {
      const queryParams = {};
      Object.keys(filters).forEach(key => {
        if (filters[key]) queryParams[key] = filters[key];
      });
      
      const response = await moveHistoryAPI.getAll(queryParams);
      setHistory(response.data.data);
    } catch (error) {
      toast.error('Failed to load move history');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await productAPI.getAll();
      setProducts(response.data.data);
    } catch (error) {
      console.error('Failed to load products');
    }
  };

  const fetchWarehouses = async () => {
    try {
      const response = await warehouseAPI.getAll();
      setWarehouses(response.data.data);
    } catch (error) {
      console.error('Failed to load warehouses');
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleApplyFilters = () => {
    setLoading(true);
    fetchHistory();
  };

  const handleResetFilters = () => {
    setFilters({
      product: '',
      warehouse: '',
      location: '',
      transactionType: '',
      startDate: '',
      endDate: ''
    });
    setLoading(true);
    setTimeout(() => fetchHistory(), 100);
  };

  const handleExport = () => {
    const csv = [
      ['Date', 'Type', 'Product', 'Warehouse', 'Location', 'Quantity', 'Balance', 'Performed By', 'Reference'].join(','),
      ...history.map(item => [
        new Date(item.createdAt).toLocaleString(),
        item.transactionType,
        item.product?.name || 'N/A',
        item.warehouse?.name || 'N/A',
        item.location?.name || 'N/A',
        item.quantity,
        item.runningBalance,
        item.performedBy?.name || 'System',
        item.reference || 'N/A'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `move-history-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('History exported successfully');
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'receipt':
        return 'bg-green-100 text-green-800';
      case 'delivery':
        return 'bg-red-100 text-red-800';
      case 'transfer_in':
        return 'bg-blue-100 text-blue-800';
      case 'transfer_out':
        return 'bg-orange-100 text-orange-800';
      case 'adjustment':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type) => {
    if (type === 'receipt' || type === 'transfer_in') {
      return <ArrowDownRight size={16} className="text-green-600" />;
    }
    return <ArrowUpRight size={16} className="text-red-600" />;
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Move History</h1>
            <p className="text-gray-600">Track all stock movements and transactions</p>
          </div>
          <button
            onClick={handleExport}
            className="btn-primary flex items-center gap-2"
            disabled={history.length === 0}
          >
            <Download size={20} />
            Export
          </button>
        </div>

        {/* Filters */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 text-gray-700 hover:text-gray-900"
            >
              <Filter size={20} />
              <span className="font-medium">Filters</span>
            </button>
            {showFilters && (
              <div className="flex gap-2">
                <button onClick={handleResetFilters} className="btn-secondary text-sm">
                  Reset
                </button>
                <button onClick={handleApplyFilters} className="btn-primary text-sm">
                  Apply
                </button>
              </div>
            )}
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
                <select
                  name="product"
                  value={filters.product}
                  onChange={handleFilterChange}
                  className="input-field"
                >
                  <option value="">All Products</option>
                  {products.map(product => (
                    <option key={product._id} value={product._id}>
                      {product.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Warehouse</label>
                <select
                  name="warehouse"
                  value={filters.warehouse}
                  onChange={handleFilterChange}
                  className="input-field"
                >
                  <option value="">All Warehouses</option>
                  {warehouses.map(warehouse => (
                    <option key={warehouse._id} value={warehouse._id}>
                      {warehouse.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Transaction Type</label>
                <select
                  name="transactionType"
                  value={filters.transactionType}
                  onChange={handleFilterChange}
                  className="input-field"
                >
                  {transactionTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  name="startDate"
                  value={filters.startDate}
                  onChange={handleFilterChange}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  name="endDate"
                  value={filters.endDate}
                  onChange={handleFilterChange}
                  className="input-field"
                />
              </div>
            </div>
          )}
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card bg-green-50 border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Receipts</p>
                <p className="text-2xl font-bold text-green-900">
                  {history.filter(h => h.transactionType === 'receipt').length}
                </p>
              </div>
              <ArrowDownRight size={32} className="text-green-600" />
            </div>
          </div>

          <div className="card bg-red-50 border-red-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-600 font-medium">Deliveries</p>
                <p className="text-2xl font-bold text-red-900">
                  {history.filter(h => h.transactionType === 'delivery').length}
                </p>
              </div>
              <ArrowUpRight size={32} className="text-red-600" />
            </div>
          </div>

          <div className="card bg-blue-50 border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Transfers</p>
                <p className="text-2xl font-bold text-blue-900">
                  {history.filter(h => h.transactionType.includes('transfer')).length}
                </p>
              </div>
              <Package size={32} className="text-blue-600" />
            </div>
          </div>

          <div className="card bg-purple-50 border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 font-medium">Adjustments</p>
                <p className="text-2xl font-bold text-purple-900">
                  {history.filter(h => h.transactionType === 'adjustment').length}
                </p>
              </div>
              <Calendar size={32} className="text-purple-600" />
            </div>
          </div>
        </div>

        {/* History Table */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Balance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reference
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Performed By
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {history.map((item) => (
                  <tr key={item._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(item.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex items-center gap-1 text-xs font-semibold rounded-full ${getTypeColor(item.transactionType)}`}>
                        {getTypeIcon(item.transactionType)}
                        {item.transactionType.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {item.product?.name || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {item.product?.sku || ''}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {item.warehouse?.name || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {item.location?.name || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-semibold ${item.quantity >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {item.quantity >= 0 ? '+' : ''}{item.quantity}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.runningBalance}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.reference || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.performedBy?.name || 'System'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {history.length === 0 && (
            <div className="text-center py-12">
              <Package size={48} className="mx-auto text-gray-400 mb-2" />
              <p className="text-gray-500">No movement history found</p>
              <p className="text-sm text-gray-400 mt-1">
                Stock movements will appear here as you perform operations
              </p>
            </div>
          )}
        </div>

        {/* Pagination Info */}
        {history.length > 0 && (
          <div className="flex justify-between items-center text-sm text-gray-600">
            <p>Showing {history.length} transactions</p>
            <p className="text-xs text-gray-500">Limited to 100 most recent transactions</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default MoveHistory;
