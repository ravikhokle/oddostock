import { useEffect, useState } from 'react';
import {
  Plus,
  Search,
  Package,
  CheckCircle,
  X,
  Edit,
  Eye,
  Trash2
} from 'lucide-react';
import Layout from '../components/Layout';
import { receiptAPI, productAPI, warehouseAPI } from '../services/api';
import toast from 'react-hot-toast';

const Receipts = () => {
  const [receipts, setReceipts] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editingReceipt, setEditingReceipt] = useState(null);
  const [viewingReceipt, setViewingReceipt] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);

  const [formData, setFormData] = useState({
    supplier: {
      name: '',
      contact: '',
      email: ''
    },
    warehouse: '',
    location: '',
    items: [{
      product: '',
      quantityOrdered: '',
      quantityReceived: '',
      unitPrice: ''
    }]
  });

  useEffect(() => {
    fetchReceipts();
    fetchProducts();
    fetchWarehouses();
  }, []);

  const fetchReceipts = async () => {
    try {
      const response = await receiptAPI.getAll();
      setReceipts(response.data.data);
    } catch (error) {
      toast.error('Failed to load receipts');
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
    if (name.startsWith('supplier.')) {
      const supplierField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        supplier: {
          ...prev.supplier,
          [supplierField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleItemChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, {
        product: '',
        quantityOrdered: '',
        quantityReceived: '',
        unitPrice: ''
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.supplier.name.trim()) {
      toast.error('Supplier name is required');
      return;
    }
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
      if (!item.quantityOrdered || item.quantityOrdered <= 0) {
        toast.error(`Quantity ordered must be greater than 0 for item ${i + 1}`);
        return;
      }
    }

    setSubmitting(true);
    try {
      // Process form data - ensure all required fields are present
      const processedData = {
        supplier: {
          name: formData.supplier.name.trim(),
          contact: formData.supplier.contact?.trim() || '',
          email: formData.supplier.email?.trim() || ''
        },
        warehouse: formData.warehouse,
        location: formData.location || formData.warehouse,
        items: formData.items
          .filter(item => item.product && item.quantityOrdered) // Filter out empty items
          .map(item => ({
            product: item.product,
            quantityOrdered: parseFloat(item.quantityOrdered) || 0,
            quantityReceived: parseFloat(item.quantityReceived) || 0,
            unitPrice: parseFloat(item.unitPrice) || 0
          }))
      };

      // Double-check we have valid items
      if (processedData.items.length === 0) {
        toast.error('At least one valid item is required');
        setSubmitting(false);
        return;
      }

      if (editingReceipt) {
        await receiptAPI.update(editingReceipt._id, processedData);
        toast.success('Receipt updated successfully');
      } else {
        await receiptAPI.create(processedData);
        toast.success('Receipt created successfully');
      }
      
      resetForm();
      fetchReceipts();
    } catch (error) {
      const action = editingReceipt ? 'update' : 'create';
      toast.error(error.response?.data?.message || `Failed to ${action} receipt`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (receipt) => {
    setEditingReceipt(receipt);
    setFormData({
      supplier: receipt.supplier,
      warehouse: receipt.warehouse._id,
      location: receipt.location._id,
      items: receipt.items.map(item => ({
        product: item.product._id,
        quantityOrdered: item.quantityOrdered.toString(),
        quantityReceived: item.quantityReceived.toString(),
        unitPrice: item.unitPrice.toString()
      }))
    });
    setShowModal(true);
  };

  const handleView = async (receipt) => {
    try {
      const response = await receiptAPI.getById(receipt._id);
      setViewingReceipt(response.data.data);
      setShowViewModal(true);
    } catch (error) {
      toast.error('Failed to load receipt details');
    }
  };

  const handleValidate = async (receiptId) => {
    if (!confirm('Are you sure you want to validate this receipt? This will update stock levels and cannot be undone.')) {
      return;
    }
    
    try {
      await receiptAPI.validate(receiptId);
      toast.success('Receipt validated successfully! Stock levels updated.');
      fetchReceipts();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to validate receipt');
    }
  };

  const resetForm = () => {
    setFormData({
      supplier: {
        name: '',
        contact: '',
        email: ''
      },
      warehouse: '',
      location: '',
      items: [{
        product: '',
        quantityOrdered: '',
        quantityReceived: '',
        unitPrice: ''
      }]
    });
    setShowModal(false);
    setEditingReceipt(null);
  };

  const getFilteredReceipts = () => {
    return receipts.filter(receipt => {
      const matchesSearch = !searchTerm || 
        receipt.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        receipt.supplier.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      draft: 'bg-gray-100 text-gray-800',
      pending: 'bg-yellow-100 text-yellow-800',
      validated: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-sm font-medium ${statusClasses[status] || statusClasses.draft}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Receipts (Incoming Goods)</h1>
            <p className="text-gray-600 mt-1">Manage incoming inventory from suppliers</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus className="w-5 h-5" />
            New Receipt
          </button>
        </div>

        {/* Search and Process Info */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search receipts by number or supplier..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
          
          {/* Process Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
              <Package className="w-5 h-5" />
              Receipt Process
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-blue-800">
              <div className="flex items-center gap-2">
                <span className="bg-blue-200 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">1</span>
                <span>Create new receipt</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-blue-200 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">2</span>
                <span>Add supplier & products</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-blue-200 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">3</span>
                <span>Input quantities received</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-blue-200 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">4</span>
                <span>Validate → stock increases</span>
              </div>
            </div>
            <div className="mt-3 text-sm text-blue-700 bg-blue-100 rounded p-2">
              <strong>Example:</strong> Receive 50 units of "Steel Rods" → Validate → Stock +50
            </div>
          </div>
        </div>

        {/* Receipts List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          </div>
        ) : receipts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">No receipts found</p>
            <p className="text-gray-400 text-sm">Create your first receipt to start tracking incoming goods</p>
          </div>
        ) : getFilteredReceipts().length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No receipts match your search</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Receipt #</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Warehouse</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {getFilteredReceipts().map((receipt) => (
                    <tr key={receipt._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {receipt.receiptNumber}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div>
                          <div className="font-medium text-gray-900">{receipt.supplier.name}</div>
                          {receipt.supplier.contact && (
                            <div className="text-gray-500 text-xs">{receipt.supplier.contact}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {receipt.warehouse?.name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className="bg-gray-100 px-2 py-1 rounded">
                          {receipt.items.length} item{receipt.items.length !== 1 ? 's' : ''}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {getStatusBadge(receipt.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(receipt.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleView(receipt)}
                            className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50 transition-colors"
                            title="View details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {receipt.status === 'draft' && (
                            <button
                              onClick={() => handleEdit(receipt)}
                              className="text-gray-600 hover:text-gray-800 p-1 rounded hover:bg-gray-50 transition-colors"
                              title="Edit receipt"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}
                          {receipt.status === 'pending' && (
                            <button
                              onClick={() => handleValidate(receipt._id)}
                              className="text-green-600 hover:text-green-800 p-1 rounded hover:bg-green-50 transition-colors"
                              title="Validate & update stock"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Create/Edit Receipt Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 z-10">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {editingReceipt ? 'Edit Receipt' : 'Create New Receipt'}
                  </h2>
                  <button
                    onClick={resetForm}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Supplier Information */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Supplier Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Supplier Name *
                      </label>
                      <input
                        type="text"
                        name="supplier.name"
                        value={formData.supplier.name}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Enter supplier name"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Contact Number
                      </label>
                      <input
                        type="text"
                        name="supplier.contact"
                        value={formData.supplier.contact}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Enter contact number"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        name="supplier.email"
                        value={formData.supplier.email}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Enter email address"
                      />
                    </div>
                  </div>
                </div>

                {/* Warehouse Information */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Warehouse Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Warehouse *
                      </label>
                      <select
                        name="warehouse"
                        value={formData.warehouse}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        required
                      >
                        <option value="">Select warehouse</option>
                        {warehouses.map(warehouse => (
                          <option key={warehouse._id} value={warehouse._id}>
                            {warehouse.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Items */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Products to Receive</h3>
                    <button
                      type="button"
                      onClick={addItem}
                      className="bg-primary-600 hover:bg-primary-700 text-white px-3 py-1 rounded-lg text-sm flex items-center gap-1 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Add Product
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {formData.items.map((item, index) => (
                      <div key={index} className="bg-white rounded-lg p-4 border border-gray-300">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-gray-900">Product {index + 1}</h4>
                          {formData.items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeItem(index)}
                              className="text-red-600 hover:text-red-800 transition-colors"
                              title="Remove product"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Product *
                            </label>
                            <select
                              value={item.product}
                              onChange={(e) => handleItemChange(index, 'product', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                              required
                            >
                              <option value="">Select product</option>
                              {products.map(product => (
                                <option key={product._id} value={product._id}>
                                  {product.name} ({product.sku})
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Qty Ordered *
                            </label>
                            <input
                              type="number"
                              value={item.quantityOrdered}
                              onChange={(e) => handleItemChange(index, 'quantityOrdered', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                              min="0"
                              step="0.01"
                              placeholder="0"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Qty Received
                            </label>
                            <input
                              type="number"
                              value={item.quantityReceived}
                              onChange={(e) => handleItemChange(index, 'quantityReceived', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                              min="0"
                              step="0.01"
                              placeholder="0"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Unit Price (₹)
                            </label>
                            <input
                              type="number"
                              value={item.unitPrice}
                              onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                              min="0"
                              step="0.01"
                              placeholder="0.00"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        {editingReceipt ? 'Updating...' : 'Creating...'}
                      </>
                    ) : (
                      <>{editingReceipt ? 'Update Receipt' : 'Create Receipt'}</>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* View Receipt Modal */}
        {showViewModal && viewingReceipt && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      Receipt Details
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">{viewingReceipt.receiptNumber}</p>
                  </div>
                  <button
                    onClick={() => setShowViewModal(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Receipt Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <h3 className="font-semibold text-gray-900 mb-3">Supplier Information</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex">
                        <span className="font-medium text-gray-600 w-24">Name:</span>
                        <span className="text-gray-900">{viewingReceipt.supplier.name}</span>
                      </div>
                      {viewingReceipt.supplier.contact && (
                        <div className="flex">
                          <span className="font-medium text-gray-600 w-24">Contact:</span>
                          <span className="text-gray-900">{viewingReceipt.supplier.contact}</span>
                        </div>
                      )}
                      {viewingReceipt.supplier.email && (
                        <div className="flex">
                          <span className="font-medium text-gray-600 w-24">Email:</span>
                          <span className="text-gray-900">{viewingReceipt.supplier.email}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <h3 className="font-semibold text-gray-900 mb-3">Receipt Information</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center">
                        <span className="font-medium text-gray-600 w-24">Status:</span>
                        {getStatusBadge(viewingReceipt.status)}
                      </div>
                      <div className="flex">
                        <span className="font-medium text-gray-600 w-24">Warehouse:</span>
                        <span className="text-gray-900">{viewingReceipt.warehouse?.name || 'N/A'}</span>
                      </div>
                      <div className="flex">
                        <span className="font-medium text-gray-600 w-24">Created:</span>
                        <span className="text-gray-900">{new Date(viewingReceipt.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Items Table */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Products</h3>
                  <div className="overflow-x-auto border border-gray-200 rounded-lg">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Qty Ordered</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Qty Received</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {viewingReceipt.items.map((item, index) => (
                          <tr key={index}>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {item.product?.name || 'Unknown Product'}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-500">
                              {item.product?.sku || 'N/A'}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 text-right">
                              {item.quantityOrdered}
                            </td>
                            <td className="px-4 py-3 text-sm text-right">
                              <span className={`font-medium ${item.quantityReceived > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                                {item.quantityReceived}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 text-right">
                              ₹{item.unitPrice.toFixed(2)}
                            </td>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                              ₹{(item.quantityReceived * item.unitPrice).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-50">
                        <tr>
                          <td colSpan="5" className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">
                            Total Amount:
                          </td>
                          <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right">
                            ₹{viewingReceipt.items.reduce((sum, item) => 
                              sum + (item.quantityReceived * item.unitPrice), 0
                            ).toFixed(2)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  {viewingReceipt.status === 'pending' && (
                    <button
                      onClick={() => {
                        setShowViewModal(false);
                        handleValidate(viewingReceipt._id);
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 transition-colors"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Validate & Update Stock
                    </button>
                  )}
                  <button
                    onClick={() => setShowViewModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Receipts;
