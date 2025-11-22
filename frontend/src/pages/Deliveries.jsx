import { useEffect, useState } from 'react';
import {
  Plus,
  Search,
  Package,
  CheckCircle,
  X,
  Edit,
  Eye,
  Truck,
  PackageCheck
} from 'lucide-react';
import Layout from '../components/Layout';
import { deliveryAPI, productAPI, warehouseAPI } from '../services/api';
import toast from 'react-hot-toast';

const Deliveries = () => {
  const [deliveries, setDeliveries] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editingDelivery, setEditingDelivery] = useState(null);
  const [viewingDelivery, setViewingDelivery] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showPickModal, setShowPickModal] = useState(false);
  const [showPackModal, setShowPackModal] = useState(false);
  const [pickingDelivery, setPickingDelivery] = useState(null);
  const [packingDelivery, setPackingDelivery] = useState(null);

  const [formData, setFormData] = useState({
    customer: {
      name: '',
      contact: '',
      email: '',
      address: ''
    },
    warehouse: '',
    location: '',
    scheduledDate: '',
    items: [{
      product: '',
      quantityOrdered: '',
      unitPrice: ''
    }]
  });

  const [pickData, setPickData] = useState([]);
  const [packData, setPackData] = useState([]);

  useEffect(() => {
    fetchDeliveries();
    fetchProducts();
    fetchWarehouses();
  }, []);

  const fetchDeliveries = async () => {
    try {
      const response = await deliveryAPI.getAll();
      setDeliveries(response.data.data);
    } catch (error) {
      toast.error('Failed to load deliveries');
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
    if (name.startsWith('customer.')) {
      const customerField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        customer: {
          ...prev.customer,
          [customerField]: value
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
    
    if (!formData.customer.name.trim()) {
      toast.error('Customer name is required');
      return;
    }
    if (!formData.warehouse) {
      toast.error('Warehouse is required');
      return;
    }
    if (!formData.scheduledDate) {
      toast.error('Scheduled date is required');
      return;
    }
    if (formData.items.length === 0) {
      toast.error('At least one item is required');
      return;
    }
    
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
      const processedData = {
        customer: {
          name: formData.customer.name.trim(),
          contact: formData.customer.contact?.trim() || '',
          email: formData.customer.email?.trim() || '',
          address: formData.customer.address?.trim() || ''
        },
        warehouse: formData.warehouse,
        location: formData.location || formData.warehouse,
        scheduledDate: formData.scheduledDate,
        items: formData.items
          .filter(item => item.product && item.quantityOrdered)
          .map(item => ({
            product: item.product,
            quantityOrdered: parseFloat(item.quantityOrdered) || 0,
            unitPrice: parseFloat(item.unitPrice) || 0
          }))
      };

      if (processedData.items.length === 0) {
        toast.error('At least one valid item is required');
        setSubmitting(false);
        return;
      }

      if (editingDelivery) {
        await deliveryAPI.update(editingDelivery._id, processedData);
        toast.success('Delivery updated successfully');
      } else {
        await deliveryAPI.create(processedData);
        toast.success('Delivery created successfully');
      }
      
      resetForm();
      fetchDeliveries();
    } catch (error) {
      const action = editingDelivery ? 'update' : 'create';
      toast.error(error.response?.data?.message || `Failed to ${action} delivery`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (delivery) => {
    setEditingDelivery(delivery);
    setFormData({
      customer: delivery.customer,
      warehouse: delivery.warehouse._id,
      location: delivery.location._id,
      scheduledDate: delivery.scheduledDate.split('T')[0],
      items: delivery.items.map(item => ({
        product: item.product._id,
        quantityOrdered: item.quantityOrdered.toString(),
        unitPrice: item.unitPrice.toString()
      }))
    });
    setShowModal(true);
  };

  const handleView = async (delivery) => {
    try {
      const response = await deliveryAPI.getById(delivery._id);
      setViewingDelivery(response.data.data);
      setShowViewModal(true);
    } catch (error) {
      toast.error('Failed to load delivery details');
    }
  };

  const handleShowPick = (delivery) => {
    setPickingDelivery(delivery);
    setPickData(delivery.items.map(item => ({
      productId: item.product._id,
      productName: item.product.name,
      quantityOrdered: item.quantityOrdered,
      quantityPicked: item.quantityPicked || 0
    })));
    setShowPickModal(true);
  };

  const handlePick = async () => {
    try {
      const items = pickData.map(item => ({
        productId: item.productId,
        quantityPicked: parseFloat(item.quantityPicked) || 0
      }));

      await deliveryAPI.pick(pickingDelivery._id, items);
      toast.success('Items picked successfully');
      setShowPickModal(false);
      setPickingDelivery(null);
      fetchDeliveries();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to pick items');
    }
  };

  const handleShowPack = (delivery) => {
    setPackingDelivery(delivery);
    setPackData(delivery.items.map(item => ({
      productId: item.product._id,
      productName: item.product.name,
      quantityPicked: item.quantityPicked || 0,
      quantityPacked: item.quantityPacked || 0
    })));
    setShowPackModal(true);
  };

  const handlePack = async () => {
    try {
      const items = packData.map(item => ({
        productId: item.productId,
        quantityPacked: parseFloat(item.quantityPacked) || 0
      }));

      await deliveryAPI.pack(packingDelivery._id, items);
      toast.success('Items packed successfully');
      setShowPackModal(false);
      setPackingDelivery(null);
      fetchDeliveries();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to pack items');
    }
  };

  const handleValidate = async (deliveryId) => {
    if (!confirm('Are you sure you want to validate this delivery? This will decrease stock levels and cannot be undone.')) {
      return;
    }
    
    try {
      await deliveryAPI.validate(deliveryId);
      toast.success('Delivery validated successfully! Stock levels updated.');
      fetchDeliveries();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to validate delivery');
    }
  };

  const resetForm = () => {
    setFormData({
      customer: {
        name: '',
        contact: '',
        email: '',
        address: ''
      },
      warehouse: '',
      location: '',
      scheduledDate: '',
      items: [{
        product: '',
        quantityOrdered: '',
        unitPrice: ''
      }]
    });
    setShowModal(false);
    setEditingDelivery(null);
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      draft: 'bg-gray-100 text-gray-800',
      waiting: 'bg-yellow-100 text-yellow-800',
      picking: 'bg-blue-100 text-blue-800',
      packing: 'bg-purple-100 text-purple-800',
      ready: 'bg-green-100 text-green-800',
      done: 'bg-green-600 text-white',
      cancelled: 'bg-red-100 text-red-800'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const filteredDeliveries = deliveries.filter(delivery =>
    delivery.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    delivery.deliveryNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Deliveries (Outgoing Goods)</h1>
            <p className="text-gray-600">Pick, pack, and ship orders to customers</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={20} />
            Create Delivery
          </button>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search deliveries..."
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Delivery #</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Warehouse</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Scheduled</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredDeliveries.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center text-gray-500">No deliveries found</td>
                  </tr>
                ) : (
                  filteredDeliveries.map((delivery) => (
                    <tr key={delivery._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {delivery.deliveryNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {delivery.customer.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {delivery.warehouse?.name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(delivery.scheduledDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(delivery.status)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex gap-2">
                        <button onClick={() => handleView(delivery)} className="text-blue-600 hover:text-blue-900" title="View">
                          <Eye size={18} />
                        </button>
                        {(delivery.status === 'draft' || delivery.status === 'waiting') && (
                          <>
                            <button onClick={() => handleEdit(delivery)} className="text-yellow-600 hover:text-yellow-900" title="Edit">
                              <Edit size={18} />
                            </button>
                            <button onClick={() => handleShowPick(delivery)} className="text-purple-600 hover:text-purple-900" title="Pick">
                              <Package size={18} />
                            </button>
                          </>
                        )}
                        {(delivery.status === 'picking' || delivery.status === 'waiting') && (
                          <button onClick={() => handleShowPack(delivery)} className="text-indigo-600 hover:text-indigo-900" title="Pack">
                            <PackageCheck size={18} />
                          </button>
                        )}
                        {delivery.status === 'ready' && (
                          <button onClick={() => handleValidate(delivery._id)} className="text-green-600 hover:text-green-900" title="Validate">
                            <Truck size={18} />
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

        {/* Create/Edit Modal - Simplified for space */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-lg max-w-4xl w-full my-8">
              <div className="p-6 border-b flex justify-between items-center">
                <h2 className="text-xl font-semibold">{editingDelivery ? 'Edit' : 'Create'} Delivery</h2>
                <button onClick={resetForm} className="text-gray-500 hover:text-gray-700"><X size={24} /></button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 max-h-[70vh] overflow-y-auto">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <input type="text" name="customer.name" value={formData.customer.name} onChange={handleInputChange} placeholder="Customer Name *" className="border rounded px-3 py-2" required />
                    <input type="text" name="customer.contact" value={formData.customer.contact} onChange={handleInputChange} placeholder="Contact" className="border rounded px-3 py-2" />
                    <input type="email" name="customer.email" value={formData.customer.email} onChange={handleInputChange} placeholder="Email" className="border rounded px-3 py-2" />
                    <input type="text" name="customer.address" value={formData.customer.address} onChange={handleInputChange} placeholder="Address" className="border rounded px-3 py-2" />
                    <select name="warehouse" value={formData.warehouse} onChange={handleInputChange} className="border rounded px-3 py-2" required>
                      <option value="">Select Warehouse *</option>
                      {warehouses.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
                    </select>
                    <input type="date" name="scheduledDate" value={formData.scheduledDate} onChange={handleInputChange} className="border rounded px-3 py-2" required />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <h3 className="font-medium">Items</h3>
                      <button type="button" onClick={addItem} className="text-blue-600 text-sm">+ Add Item</button>
                    </div>
                    {formData.items.map((item, i) => (
                      <div key={i} className="flex gap-2 mb-2 items-start">
                        <select value={item.product} onChange={(e) => handleItemChange(i, 'product', e.target.value)} className="border rounded px-3 py-2 flex-1" required>
                          <option value="">Select Product</option>
                          {products.map(p => <option key={p._id} value={p._id}>{p.name} (Stock: {p.totalStock || 0})</option>)}
                        </select>
                        <input type="number" value={item.quantityOrdered} onChange={(e) => handleItemChange(i, 'quantityOrdered', e.target.value)} placeholder="Qty" className="border rounded px-3 py-2 w-24" min="0" step="0.01" required />
                        <input type="number" value={item.unitPrice} onChange={(e) => handleItemChange(i, 'unitPrice', e.target.value)} placeholder="Price" className="border rounded px-3 py-2 w-24" min="0" step="0.01" />
                        {formData.items.length > 1 && <button type="button" onClick={() => removeItem(i)} className="text-red-600"><X size={20} /></button>}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button type="button" onClick={resetForm} className="px-4 py-2 border rounded">Cancel</button>
                  <button type="submit" disabled={submitting} className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50">
                    {submitting ? 'Saving...' : (editingDelivery ? 'Update' : 'Create')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Pick Modal */}
        {showPickModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full">
              <div className="p-6 border-b flex justify-between items-center">
                <h2 className="text-xl font-semibold">Pick Items</h2>
                <button onClick={() => setShowPickModal(false)} className="text-gray-500"><X size={24} /></button>
              </div>
              <div className="p-6">
                {pickData.map((item, i) => (
                  <div key={i} className="flex items-center gap-4 border rounded p-4 mb-3">
                    <div className="flex-1">
                      <p className="font-medium">{item.productName}</p>
                      <p className="text-sm text-gray-600">Ordered: {item.quantityOrdered}</p>
                    </div>
                    <input type="number" value={item.quantityPicked} onChange={(e) => {
                      const newData = [...pickData];
                      newData[i].quantityPicked = e.target.value;
                      setPickData(newData);
                    }} className="border rounded px-3 py-2 w-32" min="0" max={item.quantityOrdered} step="0.01" placeholder="Picked" />
                  </div>
                ))}
                <div className="flex justify-end gap-3 mt-4">
                  <button onClick={() => setShowPickModal(false)} className="px-4 py-2 border rounded">Cancel</button>
                  <button onClick={handlePick} className="px-4 py-2 bg-purple-600 text-white rounded">Confirm Pick</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pack Modal */}
        {showPackModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full">
              <div className="p-6 border-b flex justify-between items-center">
                <h2 className="text-xl font-semibold">Pack Items</h2>
                <button onClick={() => setShowPackModal(false)} className="text-gray-500"><X size={24} /></button>
              </div>
              <div className="p-6">
                {packData.map((item, i) => (
                  <div key={i} className="flex items-center gap-4 border rounded p-4 mb-3">
                    <div className="flex-1">
                      <p className="font-medium">{item.productName}</p>
                      <p className="text-sm text-gray-600">Picked: {item.quantityPicked}</p>
                    </div>
                    <input type="number" value={item.quantityPacked} onChange={(e) => {
                      const newData = [...packData];
                      newData[i].quantityPacked = e.target.value;
                      setPackData(newData);
                    }} className="border rounded px-3 py-2 w-32" min="0" max={item.quantityPicked} step="0.01" placeholder="Packed" />
                  </div>
                ))}
                <div className="flex justify-end gap-3 mt-4">
                  <button onClick={() => setShowPackModal(false)} className="px-4 py-2 border rounded">Cancel</button>
                  <button onClick={handlePack} className="px-4 py-2 bg-indigo-600 text-white rounded">Confirm Pack</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* View Modal */}
        {showViewModal && viewingDelivery && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b flex justify-between items-center">
                <h2 className="text-xl font-semibold">Delivery Details</h2>
                <button onClick={() => setShowViewModal(false)} className="text-gray-500"><X size={24} /></button>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><p className="text-sm text-gray-600">Delivery #</p><p className="font-medium">{viewingDelivery.deliveryNumber}</p></div>
                  <div><p className="text-sm text-gray-600">Status</p>{getStatusBadge(viewingDelivery.status)}</div>
                  <div><p className="text-sm text-gray-600">Customer</p><p className="font-medium">{viewingDelivery.customer.name}</p></div>
                  <div><p className="text-sm text-gray-600">Warehouse</p><p className="font-medium">{viewingDelivery.warehouse?.name}</p></div>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Items</h3>
                  <table className="min-w-full border">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs">Product</th>
                        <th className="px-4 py-2 text-left text-xs">Ordered</th>
                        <th className="px-4 py-2 text-left text-xs">Picked</th>
                        <th className="px-4 py-2 text-left text-xs">Packed</th>
                        <th className="px-4 py-2 text-right text-xs">Price</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {viewingDelivery.items.map((item, i) => (
                        <tr key={i}>
                          <td className="px-4 py-2 text-sm">{item.product.name}</td>
                          <td className="px-4 py-2 text-sm">{item.quantityOrdered}</td>
                          <td className="px-4 py-2 text-sm">{item.quantityPicked || 0}</td>
                          <td className="px-4 py-2 text-sm">{item.quantityPacked || 0}</td>
                          <td className="px-4 py-2 text-sm text-right">${item.unitPrice.toFixed(2)}</td>
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

export default Deliveries;
