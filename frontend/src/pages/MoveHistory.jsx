import Layout from '../components/Layout';
import { useEffect, useState } from 'react';
import { moveHistoryAPI } from '../services/api';
import toast from 'react-hot-toast';
import { useSocket } from '../context/SocketContext';

const MoveHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const socket = useSocket();

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    if (!socket) return;
    const refresh = () => fetchHistory();
    socket.on('stock:updated', refresh);
    socket.on('receipt:validated', refresh);
    socket.on('delivery:validated', refresh);
    socket.on('transfer:validated', refresh);
    socket.on('adjustment:validated', refresh);
    return () => {
      socket.off('stock:updated', refresh);
      socket.off('receipt:validated', refresh);
      socket.off('delivery:validated', refresh);
      socket.off('transfer:validated', refresh);
      socket.off('adjustment:validated', refresh);
    };
  }, [socket]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await moveHistoryAPI.getAll();
      setHistory(res.data.data || res.data);
    } catch (err) {
      toast.error('Failed to load move history');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Move History</h1>

        {loading ? (
          <div className="card">Loading move history...</div>
        ) : history.length === 0 ? (
          <div className="card">No history records found.</div>
        ) : (
          <div className="space-y-2">
            {history.map(h => (
              <div key={h._id} className="card p-3">
                <div className="text-sm text-gray-700">{h.transactionType} • {h.product?.name || h.product} • {h.quantity}</div>
                <div className="text-xs text-gray-500">{new Date(h.createdAt).toLocaleString()}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default MoveHistory;
