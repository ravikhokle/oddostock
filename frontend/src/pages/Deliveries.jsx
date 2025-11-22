import Layout from '../components/Layout';
import { useEffect, useState } from 'react';
import { deliveryAPI } from '../services/api';
import toast from 'react-hot-toast';
import { CheckCircle, Box, Truck, Package, Calendar } from 'lucide-react';

const Step = ({ active, label, icon: Icon }) => (
  <div className={`flex items-center gap-3 ${active ? 'text-primary-600' : 'text-gray-400'}`}>
    <div className={`p-2 rounded-full ${active ? 'bg-primary-100' : 'bg-gray-100'}`}>
      <Icon className="w-5 h-5" />
    </div>
    <div className="text-sm font-medium">{label}</div>
  </div>
);

const Deliveries = () => {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState({}); // track per-delivery busy states for animations

  useEffect(() => {
    loadDeliveries();
  }, []);

  const loadDeliveries = async () => {
    try {
      setLoading(true);
      const res = await deliveryAPI.getAll();
      setDeliveries(res.data.data || res.data);
    } catch (err) {
      toast.error('Failed to load deliveries');
    } finally {
      setLoading(false);
    }
  };

  const updateDeliveryRemote = async (id, updates) => {
    try {
      const res = await deliveryAPI.update(id, updates);
      // replace local
      setDeliveries(d => d.map(x => x._id === id ? res.data.data : x));
      return res.data.data;
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Update failed');
      throw err;
    }
  };

  const handlePickAll = async (delivery) => {
    if (!delivery) return;
    const id = delivery._id;
    try {
      setBusy(b => ({ ...b, [id]: 'picking' }));
      const items = delivery.items.map(item => ({
        ...item,
        quantityPicked: item.quantityOrdered
      }));
      await updateDeliveryRemote(id, { items, status: 'picking' });
      toast.success('All items picked');
    } catch (e) {
      // handled in updateDeliveryRemote
    } finally {
      setBusy(b => ({ ...b, [id]: null }));
    }
  };

  const handlePack = async (delivery) => {
    if (!delivery) return;
    const id = delivery._id;
    try {
      setBusy(b => ({ ...b, [id]: 'packing' }));
      // small packing animation delay to make it feel interactive
      await new Promise(r => setTimeout(r, 800));
      const items = delivery.items.map(item => ({
        ...item,
        quantityPacked: item.quantityPicked || item.quantityPacked || 0
      }));
      await updateDeliveryRemote(id, { items, status: 'packing' });
      toast.success('Items packed');
    } catch (e) {
    } finally {
      setBusy(b => ({ ...b, [id]: null }));
    }
  };

  const handleValidate = async (delivery) => {
    if (!delivery) return;
    const id = delivery._id;
    try {
      setBusy(b => ({ ...b, [id]: 'validating' }));
      // set quantityDelivered = quantityPacked
      const items = delivery.items.map(item => ({
        ...item,
        quantityDelivered: item.quantityPacked || item.quantityDelivered || 0
      }));
      // update items first
      await updateDeliveryRemote(id, { items, status: 'ready' });
      // then call validate endpoint
      await deliveryAPI.validate(id);
      toast.success('Delivery validated — stock decreased');
      // refresh list
      await loadDeliveries();
    } catch (err) {
      // show message
    } finally {
      setBusy(b => ({ ...b, [id]: null }));
    }
  };

  const renderItems = (delivery) => (
    <div className="space-y-2">
      {delivery.items.map((it, idx) => (
        <div key={idx} className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
          <div>
            <div className="text-sm font-medium">{it.product?.name || it.product}</div>
            <div className="text-xs text-gray-500">Ordered: {it.quantityOrdered} • Picked: {it.quantityPicked || 0} • Packed: {it.quantityPacked || 0}</div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePickSingle(delivery, idx)}
              className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded hover:scale-105 transition"
            >
              Pick
            </button>
            <button
              onClick={() => handlePackSingle(delivery, idx)}
              className="px-3 py-1 bg-amber-50 text-amber-700 rounded hover:scale-105 transition"
            >
              Pack
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  const handlePickSingle = async (delivery, idx) => {
    const id = delivery._id;
    try {
      setBusy(b => ({ ...b, [id]: 'picking' }));
      const items = delivery.items.map((it, i) => i === idx ? { ...it, quantityPicked: it.quantityOrdered } : it);
      await updateDeliveryRemote(id, { items, status: 'picking' });
      toast.success('Item picked');
    } catch (e) {
    } finally {
      setBusy(b => ({ ...b, [id]: null }));
    }
  };

  const handlePackSingle = async (delivery, idx) => {
    const id = delivery._id;
    try {
      setBusy(b => ({ ...b, [id]: 'packing' }));
      const items = delivery.items.map((it, i) => i === idx ? { ...it, quantityPacked: it.quantityPicked || it.quantityPacked || 0 } : it);
      await new Promise(r => setTimeout(r, 600));
      await updateDeliveryRemote(id, { items, status: 'packing' });
      toast.success('Item packed');
    } catch (e) {
    } finally {
      setBusy(b => ({ ...b, [id]: null }));
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Deliveries</h1>
        </div>

        <div className="space-y-4">
          {deliveries.length === 0 && <div className="card">No deliveries found.</div>}

          {deliveries.map((d) => (
            <div key={d._id} className="card p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <div className="text-sm text-gray-600">{d.deliveryNumber}</div>
                    <div className="text-xs text-gray-500">• {new Date(d.scheduledDate).toLocaleDateString()}</div>
                  </div>
                  <div className="text-lg font-semibold">{d.customer?.name || 'Customer'}</div>
                  <div className="text-sm text-gray-500">{d.warehouse?.name || ''} • {d.location?.name || ''}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">Status</div>
                  <div className="inline-flex items-center gap-2 mt-1">
                    <span className="px-2 py-1 rounded bg-gray-100 text-sm">{d.status}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <div className="flex items-center gap-4">
                  <Step active={d.status === 'picking' || d.status === 'packing' || d.status === 'ready' || d.status === 'done'} label="Pick" icon={Package} />
                  <div className="w-6 h-px bg-gray-200" />
                  <Step active={d.status === 'packing' || d.status === 'ready' || d.status === 'done'} label="Pack" icon={Box} />
                  <div className="w-6 h-px bg-gray-200" />
                  <Step active={d.status === 'ready' || d.status === 'done'} label="Validate" icon={CheckCircle} />
                </div>
              </div>

              <div className="mt-4">
                {renderItems(d)}
              </div>

              <div className="mt-4 flex items-center gap-3">
                <button
                  onClick={() => handlePickAll(d)}
                  disabled={busy[d._id]}
                  className="px-4 py-2 bg-emerald-600 text-white rounded hover:shadow-md transition transform active:scale-95"
                >
                  {busy[d._id] === 'picking' ? 'Picking...' : 'Pick All'}
                </button>

                <button
                  onClick={() => handlePack(d)}
                  disabled={busy[d._id]}
                  className="px-4 py-2 bg-amber-500 text-white rounded hover:shadow-md transition transform active:scale-95"
                >
                  {busy[d._id] === 'packing' ? 'Packing...' : 'Pack'}
                </button>

                <button
                  onClick={() => handleValidate(d)}
                  disabled={busy[d._id]}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:shadow-md transition transform active:scale-95"
                >
                  {busy[d._id] === 'validating' ? 'Validating...' : 'Validate'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default Deliveries;
