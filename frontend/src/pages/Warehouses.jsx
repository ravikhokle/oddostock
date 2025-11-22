import { useEffect, useState } from 'react';
import { Plus, Search, X, Edit, Eye, MapPin, Trash2 } from 'lucide-react';
import Layout from '../components/Layout';
import { warehouseAPI } from '../services/api';
import toast from 'react-hot-toast';

const Warehouses = () => {
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showWarehouseModal, setShowWarehouseModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState(null);
  const [viewingWarehouse, setViewingWarehouse] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);
  const [locations, setLocations] = useState([]);

  const [warehouseData, setWarehouseData] = useState({
    name: '',
    code: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    }
  });

  const [locationData, setLocationData] = useState({
    name: '',
    type: 'storage',
    warehouse: ''
  });

  const locationTypes = [
    { value: 'storage', label: 'Storage' },
    { value: 'production', label: 'Production' },
    { value: 'transit', label: 'Transit' },
    { value: 'vendor', label: 'Vendor' },
    { value: 'customer', label: 'Customer' }
  ];

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const fetchWarehouses = async () => {
    try {
      const response = await warehouseAPI.getAll();
      setWarehouses(response.data.data);
    } catch (error) {
      toast.error('Failed to load warehouses');
    } finally {
      setLoading(false);
    }
  };

  const fetchLocations = async (warehouseId) => {
    try {
      const response = await warehouseAPI.getLocations(warehouseId);
      setLocations(response.data.data);
    } catch (error) {
      toast.error('Failed to load locations');
    }
  };

  const handleWarehouseInputChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setWarehouseData(prev => ({
        ...prev,
        address: { ...prev.address, [addressField]: value }
      }));
    } else {
      setWarehouseData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleLocationInputChange = (e) => {
    const { name, value } = e.target;
    setLocationData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmitWarehouse = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (editingWarehouse) {
        await warehouseAPI.update(editingWarehouse._id, warehouseData);
        toast.success('Warehouse updated successfully');
      } else {
        await warehouseAPI.create(warehouseData);
        toast.success('Warehouse created successfully');
      }
      fetchWarehouses();
      handleCloseWarehouseModal();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save warehouse');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitLocation = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await warehouseAPI.createLocation({
        ...locationData,
        warehouse: selectedWarehouse._id
      });
      toast.success('Location created successfully');
      fetchLocations(selectedWarehouse._id);
      handleCloseLocationModal();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create location');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (warehouse) => {
    setEditingWarehouse(warehouse);
    setWarehouseData({
      name: warehouse.name,
      code: warehouse.code,
      address: warehouse.address || {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: ''
      }
    });
    setShowWarehouseModal(true);
  };

  const handleView = async (warehouse) => {
    setViewingWarehouse(warehouse);
    await fetchLocations(warehouse._id);
    setShowViewModal(true);
  };

  const handleDelete = async (warehouseId) => {
    if (!confirm('Are you sure you want to delete this warehouse?')) return;

    try {
      await warehouseAPI.delete(warehouseId);
      toast.success('Warehouse deleted successfully');
      fetchWarehouses();
    } catch (error) {
      toast.error('Failed to delete warehouse');
    }
  };

  const handleManageLocations = async (warehouse) => {
    setSelectedWarehouse(warehouse);
    await fetchLocations(warehouse._id);
    setLocationData({
      name: '',
      type: 'storage',
      warehouse: ''
    });
    setShowLocationModal(true);
  };

  const handleCloseWarehouseModal = () => {
    setShowWarehouseModal(false);
    setEditingWarehouse(null);
    setWarehouseData({
      name: '',
      code: '',
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: ''
      }
    });
  };

  const handleCloseLocationModal = () => {
    setShowLocationModal(false);
    setSelectedWarehouse(null);
    setLocationData({
      name: '',
      type: 'storage',
      warehouse: ''
    });
  };

  const handleCloseViewModal = () => {
    setShowViewModal(false);
    setViewingWarehouse(null);
    setLocations([]);
  };

  const filteredWarehouses = warehouses.filter(warehouse =>
    warehouse.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    warehouse.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            <h1 className="text-2xl font-bold text-gray-900">Warehouses</h1>
            <p className="text-gray-600">Manage warehouses and locations</p>
          </div>
          <button
            onClick={() => setShowWarehouseModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={20} />
            Add Warehouse
          </button>
        </div>

        {/* Search */}
        <div className="card">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search warehouses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 input-field"
            />
          </div>
        </div>

        {/* Warehouses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredWarehouses.map(warehouse => (
            <div key={warehouse._id} className="card hover:shadow-lg transition-shadow">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{warehouse.name}</h3>
                    <p className="text-sm text-gray-600 font-mono">{warehouse.code}</p>
                  </div>
                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                    Active
                  </span>
                </div>

                {warehouse.address && (
                  <div className="text-sm text-gray-600">
                    <p>{warehouse.address.street}</p>
                    <p>{warehouse.address.city}, {warehouse.address.state} {warehouse.address.zipCode}</p>
                    <p>{warehouse.address.country}</p>
                  </div>
                )}

                <div className="flex gap-2 pt-4 border-t">
                  <button
                    onClick={() => handleView(warehouse)}
                    className="flex-1 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-md flex items-center justify-center gap-2"
                  >
                    <Eye size={16} />
                    View
                  </button>
                  <button
                    onClick={() => handleManageLocations(warehouse)}
                    className="flex-1 px-3 py-2 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-md flex items-center justify-center gap-2"
                  >
                    <MapPin size={16} />
                    Locations
                  </button>
                  <button
                    onClick={() => handleEdit(warehouse)}
                    className="px-3 py-2 text-sm bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-md"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(warehouse._id)}
                    className="px-3 py-2 text-sm bg-red-100 hover:bg-red-200 text-red-700 rounded-md"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredWarehouses.length === 0 && (
          <div className="text-center py-12 card">
            <p className="text-gray-500">No warehouses found</p>
          </div>
        )}

        {/* Warehouse Modal */}
        {showWarehouseModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
                <h2 className="text-xl font-semibold">
                  {editingWarehouse ? 'Edit Warehouse' : 'Add Warehouse'}
                </h2>
                <button onClick={handleCloseWarehouseModal} className="text-gray-500 hover:text-gray-700">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmitWarehouse} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Warehouse Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={warehouseData.name}
                      onChange={handleWarehouseInputChange}
                      className="input-field"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Code *
                    </label>
                    <input
                      type="text"
                      name="code"
                      value={warehouseData.code}
                      onChange={handleWarehouseInputChange}
                      className="input-field uppercase"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
                  <input
                    type="text"
                    name="address.street"
                    value={warehouseData.address.street}
                    onChange={handleWarehouseInputChange}
                    className="input-field"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                    <input
                      type="text"
                      name="address.city"
                      value={warehouseData.address.city}
                      onChange={handleWarehouseInputChange}
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                    <input
                      type="text"
                      name="address.state"
                      value={warehouseData.address.state}
                      onChange={handleWarehouseInputChange}
                      className="input-field"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code</label>
                    <input
                      type="text"
                      name="address.zipCode"
                      value={warehouseData.address.zipCode}
                      onChange={handleWarehouseInputChange}
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                    <input
                      type="text"
                      name="address.country"
                      value={warehouseData.address.country}
                      onChange={handleWarehouseInputChange}
                      className="input-field"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseWarehouseModal}
                    className="btn-secondary"
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary" disabled={submitting}>
                    {submitting ? 'Saving...' : editingWarehouse ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Location Management Modal */}
        {showLocationModal && selectedWarehouse && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
                <h2 className="text-xl font-semibold">
                  Locations - {selectedWarehouse.name}
                </h2>
                <button onClick={handleCloseLocationModal} className="text-gray-500 hover:text-gray-700">
                  <X size={24} />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Add Location Form */}
                <form onSubmit={handleSubmitLocation} className="card bg-gray-50">
                  <h3 className="text-lg font-semibold mb-4">Add New Location</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Location Name *
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={locationData.name}
                        onChange={handleLocationInputChange}
                        className="input-field"
                        placeholder="e.g., Rack A, Section 1"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Type *
                      </label>
                      <select
                        name="type"
                        value={locationData.type}
                        onChange={handleLocationInputChange}
                        className="input-field"
                      >
                        {locationTypes.map(type => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end mt-4">
                    <button type="submit" className="btn-primary" disabled={submitting}>
                      {submitting ? 'Adding...' : 'Add Location'}
                    </button>
                  </div>
                </form>

                {/* Locations List */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Existing Locations ({locations.length})</h3>
                  {locations.length === 0 ? (
                    <div className="text-center py-8 card">
                      <MapPin size={48} className="mx-auto text-gray-400 mb-2" />
                      <p className="text-gray-500">No locations created yet</p>
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      {locations.map(location => (
                        <div key={location._id} className="card bg-white border">
                          <div className="flex justify-between items-center">
                            <div>
                              <h4 className="font-semibold text-gray-900">{location.name}</h4>
                              <p className="text-sm text-gray-600 capitalize">{location.type}</p>
                            </div>
                            <span className="px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                              Active
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* View Modal */}
        {showViewModal && viewingWarehouse && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
                <h2 className="text-xl font-semibold">Warehouse Details</h2>
                <button onClick={handleCloseViewModal} className="text-gray-500 hover:text-gray-700">
                  <X size={24} />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Warehouse Info */}
                <div className="card bg-gray-50">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Warehouse Name</p>
                      <p className="font-semibold">{viewingWarehouse.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Code</p>
                      <p className="font-semibold font-mono">{viewingWarehouse.code}</p>
                    </div>
                  </div>

                  {viewingWarehouse.address && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-600 mb-2">Address</p>
                      <div className="text-gray-900">
                        <p>{viewingWarehouse.address.street}</p>
                        <p>{viewingWarehouse.address.city}, {viewingWarehouse.address.state} {viewingWarehouse.address.zipCode}</p>
                        <p>{viewingWarehouse.address.country}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Locations */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Locations ({locations.length})</h3>
                  {locations.length === 0 ? (
                    <div className="text-center py-8 card">
                      <p className="text-gray-500">No locations in this warehouse</p>
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      {locations.map(location => (
                        <div key={location._id} className="card border">
                          <div className="flex justify-between items-center">
                            <div>
                              <h4 className="font-semibold">{location.name}</h4>
                              <p className="text-sm text-gray-600 capitalize">{location.type}</p>
                            </div>
                            <span className="px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                              Active
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Warehouses;
