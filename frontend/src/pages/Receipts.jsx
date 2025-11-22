import Layout from '../components/Layout';
import { useEffect, useState } from 'react';
import { receiptAPI } from '../services/api';
import toast from 'react-hot-toast';
import { useSocket } from '../context/SocketContext';

const Receipts = () => {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const socket = useSocket();

  useEffect(() => {
    fetchReceipts();
  }, []);

  useEffect(() => {
    if (!socket) return;
    const refresh = () => fetchReceipts();
    socket.on('receipt:created', refresh);
    socket.on('receipt:validated', refresh);
    socket.on('stock:updated', refresh);
    return () => {
      socket.off('receipt:created', refresh);
      socket.off('receipt:validated', refresh);
      socket.off('stock:updated', refresh);
    };
  }, [socket]);

  const fetchReceipts = async () => {
    try {
      setLoading(true);
      const res = await receiptAPI.getAll();
      setReceipts(res.data.data || res.data);
    } catch (err) {
      toast.error('Failed to load receipts');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Receipts</h1>

        {loading ? (
          <div className="card">Loading receipts...</div>
        ) : receipts.length === 0 ? (
          <div className="card">No receipts found.</div>
        ) : (
          <div className="space-y-4">
            {receipts.map(r => (
              <div key={r._id} className="card p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">{r.receiptNumber}</div>
                    <div className="text-sm text-gray-600">{r.supplier?.name}</div>
                  </div>
                  <div className="text-sm text-gray-500">Status: <span className="font-medium">{r.status}</span></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Receipts;
