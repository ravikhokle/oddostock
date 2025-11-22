import { useMemo, useState } from 'react';
import { Check, RefreshCw, Search as SearchIcon, Eye } from 'lucide-react';
import Layout from '../components/Layout';

const sampleProducts = [
	{ id: 1, name: 'Steel Rods', sku: 'SR-001' },
	{ id: 2, name: 'Bolt Pack', sku: 'BP-002' },
	{ id: 3, name: 'Nut Pack', sku: 'NP-003' },
	{ id: 4, name: 'Paint Can', sku: 'PC-004' }
];

const sampleWarehouses = [
	{ id: 1, name: 'Main Warehouse', location: 'Building A', stock: [{ productId: 1, qty: 200 }, { productId: 2, qty: 150 }] },
	{ id: 2, name: 'Production Floor', location: 'Factory 1', stock: [{ productId: 1, qty: 20 }, { productId: 4, qty: 40 }] },
	{ id: 3, name: 'Warehouse 2', location: 'Remote', stock: [{ productId: 2, qty: 60 }, { productId: 3, qty: 80 }] }
];

const Adjustments = () => {
	const [products] = useState(sampleProducts);
	const [warehouses, setWarehouses] = useState(sampleWarehouses);
	const [productId, setProductId] = useState(products[0].id);
	const [warehouseId, setWarehouseId] = useState(warehouses[0].id);
	const [countedQty, setCountedQty] = useState('');
	const [reason, setReason] = useState('');
	const [ledger, setLedger] = useState([]);
	const [query, setQuery] = useState('');
	const [activeAdjustment, setActiveAdjustment] = useState(null);
	const [message, setMessage] = useState(null);

	const getRecordedQty = (wId, pId) =>
		warehouses.find((w) => w.id === Number(wId))?.stock.find((s) => s.productId === Number(pId))?.qty ?? 0;

	const recordedQty = getRecordedQty(warehouseId, productId);

	const validateAndApply = (e) => {
		e?.preventDefault();
		setMessage(null);
		const counted = Number(countedQty);
		if (!Number.isFinite(counted) || counted < 0) {
			setMessage({ type: 'error', text: 'Enter a valid counted quantity (0 or greater).' });
			return;
		}
		// create adjustment entry
		const adjustment = {
			id: Date.now(),
			productId: Number(productId),
			warehouseId: Number(warehouseId),
			recordedQty,
			countedQty: counted,
			difference: counted - recordedQty,
			reason: reason.trim() || 'Count adjustment',
			createdAt: new Date().toISOString()
		};

		// update warehouse stock to counted value
		const newWarehouses = warehouses.map((w) => {
			if (w.id !== adjustment.warehouseId) return { ...w };
			const stock = w.stock.map((s) => ({ ...s }));
			const item = stock.find((s) => s.productId === adjustment.productId);
			if (item) item.qty = adjustment.countedQty;
			else stock.push({ productId: adjustment.productId, qty: adjustment.countedQty });
			return { ...w, stock };
		});

		setWarehouses(newWarehouses);
		setLedger((s) => [adjustment, ...s]);
		setActiveAdjustment(adjustment);
		setMessage({ type: 'success', text: `Adjustment saved. Difference: ${adjustment.difference}` });
		setCountedQty('');
		setReason('');
	};

	const filteredLedger = useMemo(() => {
		const q = query.trim().toLowerCase();
		if (!q) return ledger;
		return ledger.filter((a) => {
			const prod = products.find((p) => p.id === a.productId)?.name?.toLowerCase() || '';
			const wh = warehouses.find((w) => w.id === a.warehouseId)?.name?.toLowerCase() || '';
			return (
				String(a.id).includes(q) ||
				prod.includes(q) ||
				wh.includes(q) ||
				String(a.createdAt).toLowerCase().includes(q)
			);
		});
	}, [ledger, query, products, warehouses]);

	const resetForm = () => {
		setProductId(products[0].id);
		setWarehouseId(warehouses[0].id);
		setCountedQty('');
		setReason('');
		setMessage(null);
	};

	return (
		<Layout>
			<div className="space-y-6">
				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-2xl font-bold">Stock Adjustments</h1>
						<p className="text-sm text-gray-500 mt-1">
							Fix mismatches between recorded stock and physical count. Select product & location, enter counted quantity — system logs the adjustment and updates stock.
						</p>
					</div>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					{/* Adjustment form */}
					<div className="lg:col-span-2 bg-white rounded shadow p-4">
						<form onSubmit={validateAndApply} className="space-y-4">
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
								<div>
									<label className="text-sm text-gray-600">Product</label>
									<select value={productId} onChange={(e) => setProductId(Number(e.target.value))} className="mt-1 w-full px-3 py-2 border rounded">
										{products.map((p) => <option key={p.id} value={p.id}>{p.name} — {p.sku}</option>)}
									</select>
								</div>

								<div>
									<label className="text-sm text-gray-600">Location (Warehouse)</label>
									<select value={warehouseId} onChange={(e) => setWarehouseId(Number(e.target.value))} className="mt-1 w-full px-3 py-2 border rounded">
										{warehouses.map((w) => <option key={w.id} value={w.id}>{w.name} — {w.location}</option>)}
									</select>
								</div>
							</div>

							<div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
								<div>
									<label className="text-xs text-gray-600">Recorded Quantity</label>
									<div className="mt-1 px-3 py-2 border rounded bg-gray-50 text-sm">{recordedQty}</div>
								</div>

								<div>
									<label className="text-xs text-gray-600">Counted Quantity</label>
									<input type="number" min="0" value={countedQty} onChange={(e) => setCountedQty(e.target.value)} className="mt-1 w-full px-3 py-2 border rounded" />
								</div>

								<div>
									<label className="text-xs text-gray-600">Difference</label>
									<div className="mt-1 px-3 py-2 border rounded bg-gray-50 text-sm">{countedQty === '' ? '-' : Number(countedQty) - recordedQty}</div>
								</div>
							</div>

							<div>
								<label className="text-sm text-gray-600">Reason / Notes (optional)</label>
								<input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. physical count, damaged goods" className="mt-1 w-full px-3 py-2 border rounded" />
							</div>

							{message && (
								<div className={`p-3 rounded text-sm ${message.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
									{message.text}
								</div>
							)}

							<div className="flex items-center gap-3">
								<button type="submit" className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded">
									<Check className="w-4 h-4" /> Apply Adjustment
								</button>

								<button type="button" onClick={resetForm} className="inline-flex items-center gap-2 px-3 py-2 border rounded">
									<RefreshCw className="w-4 h-4" /> Reset
								</button>
							</div>
						</form>
					</div>

					{/* Ledger / quick view */}
					<aside className="bg-white rounded shadow p-4">
						<div className="flex items-center gap-2 mb-3">
							<div className="flex-1">
								<label className="text-sm text-gray-600">Search adjustments</label>
								<div className="relative mt-1">
									<input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by product, warehouse or id..." className="w-full px-3 py-2 border rounded text-sm" />
									<span className="absolute left-3 top-2 text-gray-400"><SearchIcon className="w-4 h-4" /></span>
								</div>
							</div>
						</div>

						<div className="text-sm">
							<div className="font-medium mb-2">Recent Adjustments</div>
							{filteredLedger.length === 0 ? (
								<div className="text-gray-500">No adjustments yet.</div>
							) : (
								<div className="space-y-2">
									{filteredLedger.slice(0, 8).map((a) => {
										const prod = products.find((p) => p.id === a.productId);
										const wh = warehouses.find((w) => w.id === a.warehouseId);
										return (
											<div key={a.id} className="p-2 border rounded flex items-center justify-between hover:bg-gray-50 cursor-pointer" onClick={() => setActiveAdjustment(a)}>
												<div>
													<div className="text-sm font-medium">{prod?.name} — {wh?.name}</div>
													<div className="text-xs text-gray-500">Diff: {a.difference} • {new Date(a.createdAt).toLocaleString()}</div>
												</div>
												<button onClick={(e) => { e.stopPropagation(); setActiveAdjustment(a); }} className="p-2 rounded hover:bg-gray-100" title="View">
													<Eye className="w-4 h-4" />
												</button>
											</div>
										);
									})}
								</div>
							)}
						</div>

						<div className="mt-4 text-sm">
							<div className="font-medium">Warehouse Snapshots</div>
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

				{/* Adjustment detail */}
				{activeAdjustment && (
					<div className="bg-white rounded shadow p-4">
						<div className="flex items-start justify-between">
							<div>
								<h2 className="text-lg font-semibold">Adjustment #{String(activeAdjustment.id).slice(-6)}</h2>
								<p className="text-xs text-gray-500">Created: {new Date(activeAdjustment.createdAt).toLocaleString()}</p>
							</div>
						</div>

						<div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
							<div>
								<div className="font-medium">Product</div>
								<div className="text-gray-700">{products.find((p) => p.id === activeAdjustment.productId)?.name}</div>
							</div>

							<div>
								<div className="font-medium">Location</div>
								<div className="text-gray-700">{warehouses.find((w) => w.id === activeAdjustment.warehouseId)?.name}</div>
							</div>

							<div>
								<div className="font-medium">Recorded Qty</div>
								<div className="text-gray-700">{activeAdjustment.recordedQty}</div>
							</div>

							<div>
								<div className="font-medium">Counted Qty</div>
								<div className="text-gray-700">{activeAdjustment.countedQty}</div>
							</div>

							<div className="sm:col-span-2">
								<div className="font-medium">Reason</div>
								<div className="text-gray-700">{activeAdjustment.reason}</div>
							</div>
						</div>
					</div>
				)}
			</div>
		</Layout>
	);
};

export default Adjustments;
