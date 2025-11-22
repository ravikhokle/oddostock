import { useEffect, useState } from 'react';
import { Plus, Search, X, Edit, Eye, CheckCircle, ArrowRightLeft } from 'lucide-react';
import Layout from '../components/Layout';
import { transferAPI, productAPI, warehouseAPI } from '../services/api';
import toast from 'react-hot-toast';

const Transfers = () => {
  const [transfers, setTransfers] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [locations, setLocations] = useState({ source: [], destination: [] });
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editingTransfer, setEditingTransfer] = useState(null);
  const [viewingTransfer, setViewingTransfer] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);

  const [formData, setFormData] = useState({
    sourceWarehouse: '',
    sourceLocation: '',
    destinationWarehouse: '',
    destinationLocation: '',
    scheduledDate: '',
    items: [{ product: '', quantity: '' }]
  });

  useEffect(() => {
    fetchTransfers();
    fetchProducts();
    fetchWarehouses();
  }, []);

  useEffect(() => {
    if (formData.sourceWarehouse) {
      fetchLocationsForWarehouse(formData.sourceWarehouse, 'source');
    }
  }, [formData.sourceWarehouse]);

  useEffect(() => {
    if (formData.destinationWarehouse) {
      fetchLocationsForWarehouse(formData.destinationWarehouse, 'destination');
    }
  }, [formData.destinationWarehouse]);

  const fetchTransfers = async () => {
    try {
      const response = await transferAPI.getAll();
      setTransfers(response.data.data);
    } catch (error) {
      toast.error('Failed to load transfers');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await productAPI.getAll();
      setProducts(response.data.data);
    } catch (error) {
      toast.error('Failed to load products');
    }
  };

  const fetchWarehouses = async () => {
    try {
      const response = await warehouseAPI.getAll();
      setWarehouses(response.data.data);
    } catch (error) {
      toast.error('Failed to load warehouses');
    }
  };

  const fetchLocationsForWarehouse = async (warehouseId, type) => {
    try {
      const response = await warehouseAPI.getLocations(warehouseId);
      if (type === 'source') {
        setLocations(prev => ({ ...prev, source: response.data.data }));
      } else {
        setLocations(prev => ({ ...prev, destination: response.data.data }));
      }
    } catch (error) {
      console.error('Failed to load locations');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => i === index ? { ...item, [field]: value } : item)
    }));
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { product: '', quantity: '' }]
    }));
  };

  const removeItem = (index) => {
    if (formData.items.length > 1) {
      setFormData(prev => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index)
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.sourceWarehouse || !formData.destinationWarehouse) {
      toast.error('Both source and destination warehouses are required');
      return;
    }
    if (formData.sourceWarehouse === formData.destinationWarehouse && 
        formData.sourceLocation === formData.destinationLocation) {
      toast.error('Source and destination cannot be the same');
      return;
    }
    if (!formData.scheduledDate) {
      toast.error('Scheduled date is required');
      return;
    }

    setSubmitting(true);
    try {
      const processedData = {
        sourceWarehouse: formData.sourceWarehouse,
        sourceLocation: formData.sourceLocation || formData.sourceWarehouse,
        destinationWarehouse: formData.destinationWarehouse,
        destinationLocation: formData.destinationLocation || formData.destinationWarehouse,
        scheduledDate: formData.scheduledDate,
        items: formData.items
          .filter(item => item.product && item.quantity)
          .map(item => ({
            product: item.product,
            quantity: parseFloat(item.quantity) || 0
          }))
      };

      if (processedData.items.length === 0) {
        toast.error('At least one valid item is required');
        setSubmitting(false);
        return;
      }

      if (editingTransfer) {
        await transferAPI.update(editingTransfer._id, processedData);
        toast.success('Transfer updated successfully');
      } else {
        await transferAPI.create(processedData);
        toast.success('Transfer created successfully');
      }
      
      resetForm();
      fetchTransfers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save transfer');
    } finally {
      setSubmitting(false);
    }
  };

  const handleValidate = async (transferId) => {
    if (!confirm('Are you sure you want to validate this transfer? Stock will be moved between locations.')) {
      return;
    }
    
    try {
      await transferAPI.validate(transferId);
      toast.success('Transfer validated successfully! Stock moved.');
      fetchTransfers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to validate transfer');
    }
  };

  const handleView = async (transfer) => {
    try {
      const response = await transferAPI.getById(transfer._id);
      setViewingTransfer(response.data.data);
      setShowViewModal(true);
    } catch (error) {
      toast.error('Failed to load transfer details');
    }
  };

  const resetForm = () => {
    setFormData({
      sourceWarehouse: '',
      sourceLocation: '',
      destinationWarehouse: '',
      destinationLocation: '',
      scheduledDate: '',
      items: [{ product: '', quantity: '' }]
    });
    setShowModal(false);
    setEditingTransfer(null);
  };

  const getStatusBadge = (status) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      waiting: 'bg-yellow-100 text-yellow-800',
      in_transit: 'bg-blue-100 text-blue-800',
      done: 'bg-green-600 text-white',
      cancelled: 'bg-red-100 text-red-800'
    };
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status]}`}>
      {status.replace('_', ' ').toUpperCase()}
    </span>;
  };

  const filteredTransfers = transfers.filter(t =>
    t.transferNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Internal Transfers</h1>
            <p className="text-gray-600">Move stock between warehouses and locations</p>
          </div>
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            <Plus size={20} />
            Create Transfer
          </button>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search transfers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transfer #</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">From</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">To</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Scheduled</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTransfers.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center text-gray-500">No transfers found</td>
                  </tr>
                ) : (
                  filteredTransfers.map((transfer) => (
                    <tr key={transfer._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{transfer.transferNumber}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{transfer.sourceWarehouse?.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{transfer.destinationWarehouse?.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(transfer.scheduledDate).toLocaleDateString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(transfer.status)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex gap-2">
                        <button onClick={() => handleView(transfer)} className="text-blue-600 hover:text-blue-900" title="View">
                          <Eye size={18} />
                        </button>
                        {(transfer.status === 'draft' || transfer.status === 'waiting') && (
                          <button onClick={() => handleValidate(transfer._id)} className="text-green-600 hover:text-green-900" title="Validate">
                            <CheckCircle size={18} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Create Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-lg max-w-4xl w-full my-8">
              <div className="p-6 border-b flex justify-between items-center">
                <h2 className="text-xl font-semibold">Create Transfer</h2>
                <button onClick={resetForm} className="text-gray-500"><X size={24} /></button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 max-h-[70vh] overflow-y-auto">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Source Warehouse *</label>
                      <select name="sourceWarehouse" value={formData.sourceWarehouse} onChange={handleInputChange} className="w-full border rounded px-3 py-2" required>
                        <option value="">Select Source</option>
                        {warehouses.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Destination Warehouse *</label>
                      <select name="destinationWarehouse" value={formData.destinationWarehouse} onChange={handleInputChange} className="w-full border rounded px-3 py-2" required>
                        <option value="">Select Destination</option>
                        {warehouses.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Scheduled Date *</label>
                      <input type="date" name="scheduledDate" value={formData.scheduledDate} onChange={handleInputChange} className="w-full border rounded px-3 py-2" required />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <h3 className="font-medium">Items</h3>
                      <button type="button" onClick={addItem} className="text-blue-600 text-sm">+ Add Item</button>
                    </div>
                    {formData.items.map((item, i) => (
                      <div key={i} className="flex gap-2 mb-2">
                        <select value={item.product} onChange={(e) => handleItemChange(i, 'product', e.target.value)} className="border rounded px-3 py-2 flex-1" required>
                          <option value="">Select Product</option>
                          {products.map(p => <option key={p._id} value={p._id}>{p.name} (Stock: {p.totalStock || 0})</option>)}
                        </select>
                        <input type="number" value={item.quantity} onChange={(e) => handleItemChange(i, 'quantity', e.target.value)} placeholder="Quantity" className="border rounded px-3 py-2 w-32" min="0" step="0.01" required />
                        {formData.items.length > 1 && <button type="button" onClick={() => removeItem(i)} className="text-red-600"><X size={20} /></button>}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button type="button" onClick={resetForm} className="px-4 py-2 border rounded">Cancel</button>
                  <button type="submit" disabled={submitting} className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50">
                    {submitting ? 'Creating...' : 'Create Transfer'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* View Modal */}
        {showViewModal && viewingTransfer && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b flex justify-between items-center">
                <h2 className="text-xl font-semibold">Transfer Details</h2>
                <button onClick={() => setShowViewModal(false)} className="text-gray-500"><X size={24} /></button>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><p className="text-sm text-gray-600">Transfer #</p><p className="font-medium">{viewingTransfer.transferNumber}</p></div>
                  <div><p className="text-sm text-gray-600">Status</p>{getStatusBadge(viewingTransfer.status)}</div>
                  <div><p className="text-sm text-gray-600">From</p><p className="font-medium">{viewingTransfer.sourceWarehouse?.name}</p></div>
                  <div><p className="text-sm text-gray-600">To</p><p className="font-medium">{viewingTransfer.destinationWarehouse?.name}</p></div>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Items</h3>
                  <table className="min-w-full border">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs">Product</th>
                        <th className="px-4 py-2 text-left text-xs">Quantity</th>
                        <th className="px-4 py-2 text-left text-xs">Transferred</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {viewingTransfer.items.map((item, i) => (
                        <tr key={i}>
                          <td className="px-4 py-2 text-sm">{item.product.name}</td>
                          <td className="px-4 py-2 text-sm">{item.quantity}</td>
                          <td className="px-4 py-2 text-sm">{item.quantityTransferred || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Transfers;
