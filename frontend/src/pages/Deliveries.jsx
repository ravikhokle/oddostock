import { useMemo, useState } from 'react';
import {
  Plus,
  Search as SearchIcon,
  Calendar,
  Truck,
  Edit,
  Printer,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import Layout from '../components/Layout';

const sampleOrders = [
  {
    id: 1,
    orderId: '#DO-10543',
    customer: 'Liam Johnson',
    destination: 'New York, NY',
    date: '2023-10-26',
    status: 'Delivered',
    carrier: 'FedEx',
    tracking: '7821451098',
    items: [
      { name: 'Wireless Mouse', qty: 1 },
      { name: 'Keyboard', qty: 1 }
    ],
    history: [
      { event: 'Order Created', date: '2023-10-25 14:00' },
      { event: 'Order Shipped', date: '2023-10-26 11:30' }
    ]
  },
  {
    id: 2,
    orderId: '#DO-10544',
    customer: 'Olivia Smith',
    destination: 'Los Angeles, CA',
    date: '2023-10-25',
    status: 'Shipped',
    carrier: 'UPS',
    tracking: '1Z999AA101',
    items: [
      { name: 'Wireless Noise-Cancelling Headphones', qty: 1 },
      { name: 'Smartwatch Series 8', qty: 1 }
    ],
    history: [
      { event: 'Order Created', date: '2023-10-25 14:00' },
      { event: 'Label Printed', date: '2023-10-25 16:15' },
      { event: 'Order Shipped', date: '2023-10-26 11:30' }
    ]
  },
  {
    id: 3,
    orderId: '#DO-10545',
    customer: 'Noah Williams',
    destination: 'Chicago, IL',
    date: '2023-10-25',
    status: 'Pending',
    carrier: 'USPS',
    tracking: '-',
    items: [{ name: 'Smartphone Case', qty: 2 }],
    history: [{ event: 'Order Created', date: '2023-10-25 14:00' }]
  },
  {
    id: 4,
    orderId: '#DO-10546',
    customer: 'Emma Brown',
    destination: 'Houston, TX',
    date: '2023-10-24',
    status: 'Cancelled',
    carrier: 'FedEx',
    tracking: '-',
    items: [{ name: 'Portable Charger', qty: 1 }],
    history: [
      { event: 'Order Created', date: '2023-10-24 10:00' },
      { event: 'Order Cancelled', date: '2023-10-24 12:30' }
    ]
  }
];

const statusClass = (s) =>
  s === 'Delivered'
    ? 'bg-green-50 text-green-700'
    : s === 'Shipped'
    ? 'bg-blue-50 text-blue-700'
    : s === 'Pending'
    ? 'bg-yellow-50 text-yellow-700'
    : 'bg-red-50 text-red-700';

const Deliveries = () => {
  const [orders] = useState(sampleOrders);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [selected, setSelected] = useState([]);
  const [activeOrder, setActiveOrder] = useState(sampleOrders[1]); // default right panel
  const [statusFilter, setStatusFilter] = useState('All');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter((o) => {
      if (statusFilter !== 'All' && o.status !== statusFilter) return false;
      if (!q) return true;
      return (
        o.orderId.toLowerCase().includes(q) ||
        o.customer.toLowerCase().includes(q) ||
        o.destination.toLowerCase().includes(q) ||
        (o.tracking || '').toLowerCase().includes(q)
      );
    });
  }, [orders, query, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const pageData = filtered.slice((page - 1) * perPage, page * perPage);

  const toggleSelectAll = (e) => {
    if (e.target.checked) setSelected(pageData.map((p) => p.id));
    else setSelected([]);
  };

  const toggleSelect = (id) => {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  };

  const handleCreate = () => {
    // placeholder - open create modal or navigate
    alert('Create New Order - placeholder');
  };

  const handlePrint = (order) => {
    alert(`Print order ${order.orderId} - placeholder`);
  };

  const handleEdit = (order) => {
    alert(`Edit order ${order.orderId} - placeholder`);
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Delivery Orders</h1>
            <p className="text-sm text-gray-500 mt-1">Manage outgoing deliveries, view order details and history.</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handleCreate} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700">
              <Plus className="w-4 h-4" /> Create New Order
            </button>
          </div>
        </div>

        {/* Main grid: table + detail pane */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Table area */}
          <div className="lg:col-span-3 bg-white rounded shadow">
            <div className="p-4 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="relative">
                  <input
                    value={query}
                    onChange={(e) => { setQuery(e.target.value); setPage(1); }}
                    placeholder="Search by Order ID or Customer..."
                    className="pl-10 pr-3 py-2 border rounded w-72 text-sm"
                  />
                  <span className="absolute left-3 top-2 text-gray-400"><SearchIcon className="w-4 h-4" /></span>
                </div>

                <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="py-2 px-3 border rounded text-sm">
                  <option>All</option>
                  <option>Pending</option>
                  <option>Shipped</option>
                  <option>Delivered</option>
                  <option>Cancelled</option>
                </select>

                <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500">
                  <Calendar className="w-4 h-4" /> <span>Sort by date</span>
                </div>
              </div>

              <div className="text-sm text-gray-500">
                Showing {filtered.length === 0 ? 0 : (page - 1) * perPage + 1} - {Math.min(page * perPage, filtered.length)} of {filtered.length}
              </div>
            </div>

            <div className="p-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-gray-600">
                  <tr>
                    <th className="py-2 pr-3">
                      <input type="checkbox" onChange={toggleSelectAll} checked={pageData.every((p) => selected.includes(p.id)) && pageData.length > 0} />
                    </th>
                    <th className="py-2">ORDER ID</th>
                    <th className="py-2">CUSTOMER</th>
                    <th className="py-2">DESTINATION</th>
                    <th className="py-2">ORDER DATE</th>
                    <th className="py-2">STATUS</th>
                    <th className="py-2">CARRIER</th>
                    <th className="py-2">TRACKING #</th>
                    <th className="py-2">ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {pageData.length === 0 && (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-gray-500">No orders found</td>
                    </tr>
                  )}
                  {pageData.map((o) => (
                    <tr key={o.id} className={`border-t hover:bg-gray-50 ${activeOrder?.id === o.id ? 'bg-blue-50' : ''}`} onClick={() => setActiveOrder(o)}>
                      <td className="py-3 pr-3">
                        <input type="checkbox" checked={selected.includes(o.id)} onChange={(e) => { e.stopPropagation(); toggleSelect(o.id); }} />
                      </td>
                      <td className="py-3 font-medium">{o.orderId}</td>
                      <td className="py-3">{o.customer}</td>
                      <td className="py-3">{o.destination}</td>
                      <td className="py-3">{o.date}</td>
                      <td className="py-3">
                        <span className={`px-2 py-1 text-xs rounded ${statusClass(o.status)}`}>{o.status}</span>
                      </td>
                      <td className="py-3">{o.carrier}</td>
                      <td className="py-3 text-blue-600">{o.tracking}</td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <button onClick={(e) => { e.stopPropagation(); handlePrint(o); }} className="p-2 rounded hover:bg-gray-100">
                            <Printer className="w-4 h-4" />
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); handleEdit(o); }} className="p-2 rounded hover:bg-gray-100">
                            <Edit className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between p-4 border-t">
              <div className="flex items-center gap-2">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="p-2 border rounded disabled:opacity-50">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 border rounded disabled:opacity-50">
                  <ChevronRight className="w-4 h-4" />
                </button>
                <div className="text-sm text-gray-600">Page {page} of {totalPages}</div>
              </div>

              <div className="flex items-center gap-3">
                <label className="text-sm text-gray-600">Per page</label>
                <select value={perPage} onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }} className="border rounded px-2 py-1">
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                </select>
              </div>
            </div>
          </div>

          {/* Right detail pane */}
          <aside className="bg-white rounded shadow p-4">
            {activeOrder ? (
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-semibold">{activeOrder.orderId}</h2>
                    <p className="text-xs text-gray-500">Created on {activeOrder.date}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-sm ${statusClass(activeOrder.status)}`}>{activeOrder.status}</span>
                </div>

                <div>
                  <h3 className="text-sm font-medium">Customer Details</h3>
                  <p className="text-sm text-gray-700 mt-1">{activeOrder.customer}</p>
                  <p className="text-xs text-gray-500">{activeOrder.destination}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium">Items Ordered</h3>
                  <ul className="mt-2 space-y-1">
                    {activeOrder.items.map((it, i) => (
                      <li key={i} className="flex justify-between text-sm">
                        <span>{it.name}</span>
                        <span className="text-gray-600">x{it.qty}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="text-sm font-medium">Shipping Details</h3>
                  <p className="text-sm mt-1">Carrier: {activeOrder.carrier}</p>
                  <p className="text-sm">Tracking #: <span className="text-blue-600">{activeOrder.tracking}</span></p>
                </div>

                <div>
                  <h3 className="text-sm font-medium">Order History</h3>
                  <ul className="mt-2 space-y-2 text-xs text-gray-600">
                    {activeOrder.history.map((h, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="w-2 h-2 rounded-full bg-gray-300 mt-1" />
                        <div>
                          <div className="font-medium">{h.event}</div>
                          <div className="text-xs text-gray-400">{h.date}</div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="text-gray-500">Select an order to view details</div>
            )}
          </aside>
        </div>
      </div>
    </Layout>
  );
};

export default Deliveries;
