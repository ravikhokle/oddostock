import { useEffect, useState } from 'react';
import { Plus, Search, X, Edit, Eye, CheckCircle, AlertTriangle } from 'lucide-react';
import Layout from '../components/Layout';
import { adjustmentAPI, productAPI, warehouseAPI } from '../services/api';
import toast from 'react-hot-toast';

const Adjustments = () => {
  const [adjustments, setAdjustments] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editingAdjustment, setEditingAdjustment] = useState(null);
  const [viewingAdjustment, setViewingAdjustment] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);

  const [formData, setFormData] = useState({
    warehouse: '',
    location: '',
    items: [{
      product: '',
      recordedQuantity: '',
      countedQuantity: '',
      reason: 'cycle_count',
      notes: ''
    }]
  });

  const reasons = [
    { value: 'damaged', label: 'Damaged' },
    { value: 'lost', label: 'Lost' },
    { value: 'found', label: 'Found' },
    { value: 'expired', label: 'Expired' },
    { value: 'theft', label: 'Theft' },
    { value: 'cycle_count', label: 'Cycle Count' },
    { value: 'other', label: 'Other' }
  ];

  useEffect(() => {
    fetchAdjustments();
    fetchProducts();
    fetchWarehouses();
  }, []);

  const fetchAdjustments = async () => {
    try {
      const response = await adjustmentAPI.getAll();
      setAdjustments(response.data.data);
    } catch (error) {
      toast.error('Failed to load adjustments');
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => {
        if (i === index) {
          const updated = { ...item, [field]: value };
          // Auto-calculate difference when quantities change
          if (field === 'recordedQuantity' || field === 'countedQuantity') {
            const recorded = parseFloat(field === 'recordedQuantity' ? value : item.recordedQuantity) || 0;
            const counted = parseFloat(field === 'countedQuantity' ? value : item.countedQuantity) || 0;
            updated.difference = counted - recorded;
          }
          return updated;
        }
        return item;
      })
    }));
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, {
        product: '',
        recordedQuantity: '',
        countedQuantity: '',
        reason: 'cycle_count',
        notes: ''
      }]
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

  const autoFillRecordedStock = async (index, productId) => {
    if (!productId) return;
    
    const product = products.find(p => p._id === productId);
    if (product) {
      handleItemChange(index, 'recordedQuantity', product.totalStock?.toString() || '0');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.warehouse) {
      toast.error('Warehouse is required');
      return;
    }
    if (formData.items.length === 0) {
      toast.error('At least one item is required');
      return;
    }

    // Validate items
    for (let i = 0; i < formData.items.length; i++) {
      const item = formData.items[i];
      if (!item.product) {
        toast.error(`Product is required for item ${i + 1}`);
        return;
      }
      if (item.recordedQuantity === '' || item.countedQuantity === '') {
        toast.error(`Both recorded and counted quantities are required for item ${i + 1}`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const processedData = {
        warehouse: formData.warehouse,
        location: formData.location || formData.warehouse,
        items: formData.items
          .filter(item => item.product)
          .map(item => {
            const recorded = parseFloat(item.recordedQuantity) || 0;
            const counted = parseFloat(item.countedQuantity) || 0;
            return {
              product: item.product,
              recordedQuantity: recorded,
              countedQuantity: counted,
              difference: counted - recorded,
              reason: item.reason,
              notes: item.notes || ''
            };
          })
      };

      if (processedData.items.length === 0) {
        toast.error('At least one valid item is required');
        setSubmitting(false);
        return;
      }

      if (editingAdjustment) {
        await adjustmentAPI.update(editingAdjustment._id, processedData);
        toast.success('Adjustment updated successfully');
      } else {
        await adjustmentAPI.create(processedData);
        toast.success('Adjustment created successfully');
      }
      
      resetForm();
      fetchAdjustments();
    } catch (error) {
      const action = editingAdjustment ? 'update' : 'create';
      toast.error(error.response?.data?.message || `Failed to ${action} adjustment`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleValidate = async (adjustmentId) => {
    if (!confirm('Are you sure you want to validate this adjustment? This will update stock levels and cannot be undone.')) {
      return;
    }
    
    try {
      await adjustmentAPI.validate(adjustmentId);
      toast.success('Adjustment validated successfully! Stock levels updated.');
      fetchAdjustments();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to validate adjustment');
    }
  };

  const handleView = async (adjustment) => {
    try {
      const response = await adjustmentAPI.getById(adjustment._id);
      setViewingAdjustment(response.data.data);
      setShowViewModal(true);
    } catch (error) {
      toast.error('Failed to load adjustment details');
    }
  };

  const resetForm = () => {
    setFormData({
      warehouse: '',
      location: '',
      items: [{
        product: '',
        recordedQuantity: '',
        countedQuantity: '',
        reason: 'cycle_count',
        notes: ''
      }]
    });
    setShowModal(false);
    setEditingAdjustment(null);
  };

  const getStatusBadge = (status) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      done: 'bg-green-600 text-white',
      cancelled: 'bg-red-100 text-red-800'
    };
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status]}`}>
      {status.toUpperCase()}
    </span>;
  };

  const getDifferenceColor = (diff) => {
    if (diff > 0) return 'text-green-600';
    if (diff < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const filteredAdjustments = adjustments.filter(a =>
    a.adjustmentNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Stock Adjustments</h1>
            <p className="text-gray-600">Record physical counts and adjust stock levels</p>
          </div>
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            <Plus size={20} />
            Create Adjustment
          </button>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search adjustments..."
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Adjustment #</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Warehouse</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAdjustments.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center text-gray-500">No adjustments found</td>
                  </tr>
                ) : (
                  filteredAdjustments.map((adjustment) => (
                    <tr key={adjustment._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{adjustment.adjustmentNumber}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{adjustment.warehouse?.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(adjustment.adjustmentDate).toLocaleDateString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(adjustment.status)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex gap-2">
                        <button onClick={() => handleView(adjustment)} className="text-blue-600 hover:text-blue-900" title="View">
                          <Eye size={18} />
                        </button>
                        {adjustment.status === 'draft' && (
                          <button onClick={() => handleValidate(adjustment._id)} className="text-green-600 hover:text-green-900" title="Validate">
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
            <div className="bg-white rounded-lg max-w-6xl w-full my-8">
              <div className="p-6 border-b flex justify-between items-center">
                <h2 className="text-xl font-semibold">Create Stock Adjustment</h2>
                <button onClick={resetForm} className="text-gray-500"><X size={24} /></button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 max-h-[70vh] overflow-y-auto">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Warehouse *</label>
                      <select name="warehouse" value={formData.warehouse} onChange={handleInputChange} className="w-full border rounded px-3 py-2" required>
                        <option value="">Select Warehouse</option>
                        {warehouses.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <h3 className="font-medium">Items (Recorded vs Physical Count)</h3>
                      <button type="button" onClick={addItem} className="text-blue-600 text-sm">+ Add Item</button>
                    </div>
                    <div className="text-xs text-gray-600 mb-3 p-3 bg-blue-50 rounded">
                      <AlertTriangle size={14} className="inline mr-1" />
                      Record the system stock (recorded) vs actual physical count. The difference will be applied to stock.
                    </div>
                    {formData.items.map((item, i) => (
                      <div key={i} className="border rounded p-4 mb-3">
                        <div className="grid grid-cols-6 gap-2 mb-2">
                          <div className="col-span-2">
                            <label className="block text-xs font-medium mb-1">Product *</label>
                            <select 
                              value={item.product} 
                              onChange={(e) => {
                                handleItemChange(i, 'product', e.target.value);
                                autoFillRecordedStock(i, e.target.value);
                              }} 
                              className="w-full border rounded px-2 py-1 text-sm" 
                              required
                            >
                              <option value="">Select Product</option>
                              {products.map(p => <option key={p._id} value={p._id}>{p.name} (Stock: {p.totalStock || 0})</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium mb-1">Recorded *</label>
                            <input 
                              type="number" 
                              value={item.recordedQuantity} 
                              onChange={(e) => handleItemChange(i, 'recordedQuantity', e.target.value)} 
                              className="w-full border rounded px-2 py-1 text-sm" 
                              min="0" 
                              step="0.01" 
                              placeholder="System"
                              required 
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium mb-1">Physical Count *</label>
                            <input 
                              type="number" 
                              value={item.countedQuantity} 
                              onChange={(e) => handleItemChange(i, 'countedQuantity', e.target.value)} 
                              className="w-full border rounded px-2 py-1 text-sm" 
                              min="0" 
                              step="0.01" 
                              placeholder="Counted"
                              required 
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium mb-1">Difference</label>
                            <input 
                              type="text" 
                              value={item.difference !== undefined ? item.difference : ''} 
                              className={`w-full border rounded px-2 py-1 text-sm font-bold ${getDifferenceColor(item.difference)}`}
                              readOnly 
                              placeholder="Auto"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium mb-1">Reason *</label>
                            <select value={item.reason} onChange={(e) => handleItemChange(i, 'reason', e.target.value)} className="w-full border rounded px-2 py-1 text-sm" required>
                              {reasons.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                            </select>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            value={item.notes} 
                            onChange={(e) => handleItemChange(i, 'notes', e.target.value)} 
                            placeholder="Notes (optional)" 
                            className="flex-1 border rounded px-2 py-1 text-sm"
                          />
                          {formData.items.length > 1 && (
                            <button type="button" onClick={() => removeItem(i)} className="text-red-600"><X size={20} /></button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button type="button" onClick={resetForm} className="px-4 py-2 border rounded">Cancel</button>
                  <button type="submit" disabled={submitting} className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50">
                    {submitting ? 'Creating...' : 'Create Adjustment'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* View Modal */}
        {showViewModal && viewingAdjustment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b flex justify-between items-center">
                <h2 className="text-xl font-semibold">Adjustment Details</h2>
                <button onClick={() => setShowViewModal(false)} className="text-gray-500"><X size={24} /></button>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div><p className="text-sm text-gray-600">Adjustment #</p><p className="font-medium">{viewingAdjustment.adjustmentNumber}</p></div>
                  <div><p className="text-sm text-gray-600">Status</p>{getStatusBadge(viewingAdjustment.status)}</div>
                  <div><p className="text-sm text-gray-600">Warehouse</p><p className="font-medium">{viewingAdjustment.warehouse?.name}</p></div>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Items</h3>
                  <table className="min-w-full border">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs">Product</th>
                        <th className="px-4 py-2 text-center text-xs">Recorded</th>
                        <th className="px-4 py-2 text-center text-xs">Counted</th>
                        <th className="px-4 py-2 text-center text-xs">Difference</th>
                        <th className="px-4 py-2 text-left text-xs">Reason</th>
                        <th className="px-4 py-2 text-left text-xs">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {viewingAdjustment.items.map((item, i) => (
                        <tr key={i}>
                          <td className="px-4 py-2 text-sm">{item.product.name}</td>
                          <td className="px-4 py-2 text-sm text-center">{item.recordedQuantity}</td>
                          <td className="px-4 py-2 text-sm text-center">{item.countedQuantity}</td>
                          <td className={`px-4 py-2 text-sm text-center font-bold ${getDifferenceColor(item.difference)}`}>
                            {item.difference > 0 ? '+' : ''}{item.difference}
                          </td>
                          <td className="px-4 py-2 text-sm capitalize">{item.reason.replace('_', ' ')}</td>
                          <td className="px-4 py-2 text-sm text-gray-600">{item.notes || '-'}</td>
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

export default Adjustments;
