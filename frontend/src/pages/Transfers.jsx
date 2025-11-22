import { useMemo, useState } from 'react';
import { Plus, Trash2, Eye } from 'lucide-react';
import Layout from '../components/Layout';

const sampleProducts = [
  { id: 1, name: 'Steel Rods', sku: 'SR-001' },
  { id: 2, name: 'Bolt Pack', sku: 'BP-002' },
  { id: 3, name: 'Nut Pack', sku: 'NP-003' },
  { id: 4, name: 'Paint Can', sku: 'PC-004' }
];

const sampleWarehouses = [
  {
    id: 1,
    name: 'Main Warehouse',
    location: 'Building A',
    stock: [
      { productId: 1, qty: 200 },
      { productId: 2, qty: 150 },
      { productId: 3, qty: 300 }
    ]
  },
  {
    id: 2,
    name: 'Production Floor',
    location: 'Factory 1',
    stock: [
      { productId: 1, qty: 20 },
      { productId: 4, qty: 40 }
    ]
  },
  {
    id: 3,
    name: 'Warehouse 2',
    location: 'Remote',
    stock: [
      { productId: 2, qty: 60 },
      { productId: 3, qty: 80 }
    ]
  }
];

const emptyLine = () => ({ id: Date.now() + Math.random(), productId: '', quantity: '' });

const Transfers = () => {
  const [warehouses, setWarehouses] = useState(sampleWarehouses);
  const [products] = useState(sampleProducts);
  const [lines, setLines] = useState([emptyLine()]);
  const [fromId, setFromId] = useState(warehouses[0].id);
  const [toId, setToId] = useState(warehouses[1].id);
  const [ledger, setLedger] = useState([]);
  const [query, setQuery] = useState('');
  const [activeTransfer, setActiveTransfer] = useState(null);
  const [message, setMessage] = useState(null);

  const findStock = (warehouseId, productId) =>
    warehouses.find((w) => w.id === Number(warehouseId))?.stock.find((s) => s.productId === Number(productId))?.qty || 0;

  const updateLine = (id, field, value) => {
    setLines((s) => s.map((l) => (l.id === id ? { ...l, [field]: value } : l)));
  };

  const addLine = () => setLines((s) => [...s, emptyLine()]);
  const removeLine = (id) => setLines((s) => s.filter((l) => l.id !== id));

  const validate = () => {
    if (fromId === toId) {
      setMessage({ type: 'error', text: 'Source and destination must be different.' });
      return false;
    }
    for (const l of lines) {
      if (!l.productId) {
        setMessage({ type: 'error', text: 'Select product for each line.' });
        return false;
      }
      const q = Number(l.quantity);
      if (!Number.isFinite(q) || q <= 0) {
        setMessage({ type: 'error', text: 'Quantity must be a number greater than 0.' });
        return false;
      }
      const available = findStock(fromId, l.productId);
      if (q > available) {
        const prod = products.find((p) => p.id === Number(l.productId))?.name || 'product';
        setMessage({ type: 'error', text: `Not enough stock in source for ${prod}. Available: ${available}` });
        return false;
      }
    }
    return true;
  };

  const handleCreateTransfer = (e) => {
    e?.preventDefault();
    setMessage(null);
    if (!validate()) return;

    // perform stock moves locally (simulate ledger)
    const newWarehouses = warehouses.map((w) => {
      // deep copy stock array
      const stock = w.stock.map((s) => ({ ...s }));
      return { ...w, stock };
    });

    for (const l of lines) {
      const pid = Number(l.productId);
      const qty = Number(l.quantity);

      // subtract from source
      const src = newWarehouses.find((w) => w.id === Number(fromId));
      const srcItem = src.stock.find((s) => s.productId === pid);
      if (srcItem) srcItem.qty = Math.max(0, srcItem.qty - qty);
      else src.stock.push({ productId: pid, qty: 0 - qty }); // guard, shouldn't happen due to validation

      // add to destination
      const dst = newWarehouses.find((w) => w.id === Number(toId));
      const dstItem = dst.stock.find((s) => s.productId === pid);
      if (dstItem) dstItem.qty = dstItem.qty + qty;
      else dst.stock.push({ productId: pid, qty });
    }

    const transfer = {
      id: Date.now(),
      fromId: Number(fromId),
      toId: Number(toId),
      lines: lines.map((l) => ({ productId: Number(l.productId), quantity: Number(l.quantity) })),
      createdAt: new Date().toISOString()
    };

    setWarehouses(newWarehouses);
    setLedger((s) => [transfer, ...s]);
    setLines([emptyLine()]);
    setMessage({ type: 'success', text: 'Transfer recorded and ledger updated.' });
    setActiveTransfer(transfer);
  };

  const filteredLedger = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ledger;
    return ledger.filter((t) => {
      const from = warehouses.find((w) => w.id === t.fromId)?.name || '';
      const to = warehouses.find((w) => w.id === t.toId)?.name || '';
      const productsText = t.lines
        .map((l) => products.find((p) => p.id === l.productId)?.name || '')
        .join(' ')
        .toLowerCase();

      return (
        String(t.id).includes(q) ||
        from.toLowerCase().includes(q) ||
        to.toLowerCase().includes(q) ||
        productsText.includes(q) ||
        t.createdAt.toLowerCase().includes(q)
      );
    });
  }, [ledger, query, warehouses, products]);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Internal Transfers</h1>
            <p className="text-sm text-gray-500 mt-1">
              Move stock between locations. Each movement is logged in the ledger.
              Example: Main Warehouse → Production Floor
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form */}
          <div className="lg:col-span-2 bg-white rounded shadow p-4">
            <form onSubmit={handleCreateTransfer} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-gray-600">From (Source)</label>
                  <select value={fromId} onChange={(e) => setFromId(Number(e.target.value))} className="mt-1 w-full px-3 py-2 border rounded">
                    {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name} — {w.location}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-sm text-gray-600">To (Destination)</label>
                  <select value={toId} onChange={(e) => setToId(Number(e.target.value))} className="mt-1 w-full px-3 py-2 border rounded">
                    {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name} — {w.location}</option>)}
                  </select>
                </div>
              </div>

              <div className="border-t pt-4 space-y-3">
                {lines.map((line, idx) => (
                  <div key={line.id} className="flex gap-2 items-end">
                    <div className="flex-1">
                      <label className="text-xs text-gray-600">Product</label>
                      <select value={line.productId} onChange={(e) => updateLine(line.id, 'productId', Number(e.target.value))} className="mt-1 w-full px-3 py-2 border rounded">
                        <option value="">Select product</option>
                        {products.map((p) => <option key={p.id} value={p.id}>{p.name} — {p.sku}</option>)}
                      </select>
                      <div className="text-xs text-gray-400 mt-1">
                        Available in source: {line.productId ? findStock(fromId, line.productId) : '-'}
                      </div>
                    </div>

                    <div style={{ width: 120 }}>
                      <label className="text-xs text-gray-600">Quantity</label>
                      <input type="number" min="0" value={line.quantity} onChange={(e) => updateLine(line.id, 'quantity', e.target.value)} className="mt-1 w-full px-3 py-2 border rounded" />
                    </div>

                    <div className="w-12">
                      <button type="button" onClick={() => removeLine(line.id)} className="p-2 rounded bg-red-50 text-red-600 hover:bg-red-100" title="Remove line">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}

                <div>
                  <button type="button" onClick={addLine} className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 rounded text-sm">
                    <Plus className="w-4 h-4" /> Add line
                  </button>
                </div>
              </div>

              {message && (
                <div className={`p-3 rounded text-sm ${message.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                  {message.text}
                </div>
              )}

              <div className="flex items-center gap-3">
                <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded">Create Transfer</button>
                <button type="button" onClick={() => { setLines([emptyLine()]); setMessage(null); }} className="px-4 py-2 border rounded">Reset</button>
              </div>
            </form>
          </div>

          {/* Ledger / stocks summary */}
          <aside className="bg-white rounded shadow p-4">
            <h3 className="text-lg font-medium">Ledger & Stocks</h3>

            <div className="mt-3">
              <label className="text-sm text-gray-600">Search ledger</label>
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by id, warehouse or product..." className="mt-1 w-full px-3 py-2 border rounded text-sm" />
            </div>

            <div className="mt-4 text-sm">
              <div className="font-medium mb-2">Recent Transfers</div>
              {filteredLedger.length === 0 ? (
                <div className="text-gray-500">No transfers recorded yet.</div>
              ) : (
                <div className="space-y-2">
                  {filteredLedger.slice(0, 6).map((t) => {
                    const from = warehouses.find((w) => w.id === t.fromId)?.name || 'Unknown';
                    const to = warehouses.find((w) => w.id === t.toId)?.name || 'Unknown';
                    return (
                      <div key={t.id} className="p-2 border rounded flex items-center justify-between hover:bg-gray-50 cursor-pointer" onClick={() => setActiveTransfer(t)}>
                        <div>
                          <div className="text-sm font-medium">Transfer #{String(t.id).slice(-6)}</div>
                          <div className="text-xs text-gray-500">{from} → {to}</div>
                          <div className="text-xs text-gray-500">
                            {t.lines.map((l) => `${products.find((p) => p.id === l.productId)?.name || ''} x${l.quantity}`).join(', ')}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={(e) => { e.stopPropagation(); setActiveTransfer(t); }} className="p-2 rounded hover:bg-gray-100" title="View">
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="mt-4 text-sm">
              <div className="font-medium">Warehouse Stocks (summary)</div>
              <div className="mt-2 space-y-2">
                {warehouses.map((w) => (
                  <div key={w.id} className="p-2 border rounded">
                    <div className="font-medium">{w.name}</div>
                    <div className="text-xs text-gray-500">{w.location}</div>
                    <div className="mt-2 text-xs">
                      {w.stock.map((s) => {
                        const prod = products.find((p) => p.id === s.productId)?.name || 'Unknown';
                        return <div key={s.productId} className="flex justify-between"><span>{prod}</span><span className="text-gray-600">{s.qty}</span></div>;
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>

        {/* Transfer detail panel */}
        {activeTransfer && (
          <div className="bg-white rounded shadow p-4">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold">Transfer #{String(activeTransfer.id).slice(-6)}</h2>
                <p className="text-xs text-gray-500">Created at {new Date(activeTransfer.createdAt).toLocaleString()}</p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <div className="font-medium">From</div>
                <div className="text-gray-700">{warehouses.find((w) => w.id === activeTransfer.fromId)?.name}</div>
              </div>
              <div>
                <div className="font-medium">To</div>
                <div className="text-gray-700">{warehouses.find((w) => w.id === activeTransfer.toId)?.name}</div>
              </div>

              <div className="sm:col-span-2">
                <div className="font-medium">Items</div>
                <ul className="mt-2 space-y-1">
                  {activeTransfer.lines.map((l, i) => {
                    const prod = products.find((p) => p.id === l.productId);
                    return <li key={i} className="flex justify-between"><span>{prod?.name} ({prod?.sku})</span><span>x{l.quantity}</span></li>;
                  })}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Transfers;
