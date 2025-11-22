import Layout from '../components/Layout';
import { useEffect, useState } from 'react';
import { transferAPI } from '../services/api';
import toast from 'react-hot-toast';
import { useSocket } from '../context/SocketContext';

const Transfers = () => {
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const socket = useSocket();

  useEffect(() => {
    fetchTransfers();
  }, []);

  useEffect(() => {
    if (!socket) return;
    const refresh = () => fetchTransfers();
    socket.on('transfer:created', refresh);
    socket.on('transfer:validated', refresh);
    socket.on('stock:updated', refresh);
    return () => {
      socket.off('transfer:created', refresh);
      socket.off('transfer:validated', refresh);
      socket.off('stock:updated', refresh);
    };
  }, [socket]);

  const fetchTransfers = async () => {
    try {
      setLoading(true);
      const res = await transferAPI.getAll();
      setTransfers(res.data.data || res.data);
    } catch (err) {
      toast.error('Failed to load transfers');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Internal Transfers</h1>

        {loading ? (
          <div className="card">Loading transfers...</div>
        ) : transfers.length === 0 ? (
          <div className="card">No transfers found.</div>
        ) : (
          <div className="space-y-4">
            {transfers.map(t => (
              <div key={t._id} className="card p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">{t.transferNumber}</div>
                    <div className="text-sm text-gray-600">{t.fromWarehouse?.name} → {t.toWarehouse?.name}</div>
                  </div>
                  <div className="text-sm text-gray-500">Status: <span className="font-medium">{t.status}</span></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Transfers;
