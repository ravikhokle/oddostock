import { useMemo, useState } from 'react';
import {
  Plus,
  Sliders,
} from 'react-feather';
import Layout from '../components/Layout';

const Receipts = () => {
  const [filter, setFilter] = useState('');
  const [sort, setSort] = useState('asc');

  const handleFilterChange = (e) => {
    setFilter(e.target.value);
  };

  const handleSortChange = () => {
    setSort((prevSort) => (prevSort === 'asc' ? 'desc' : 'asc'));
  };

  const filteredAndSortedReceipts = useMemo(() => {
    let receipts = [...dummyReceipts]; // Replace with your actual data source

    if (filter) {
      receipts = receipts.filter((receipt) =>
        receipt.name.toLowerCase().includes(filter.toLowerCase())
      );
    }

    receipts.sort((a, b) => {
      if (sort === 'asc') {
        return a.date.localeCompare(b.date);
      } else {
        return b.date.localeCompare(a.date);
      }
    });

    return receipts;
  }, [filter, sort]);

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Receipts</h1>
        <div className="card">
          <p>Manage incoming stock receipts here. Full implementation coming soon.</p>
        </div>
        <div className="flex justify-between">
          <input
            type="text"
            placeholder="Filter by name..."
            value={filter}
            onChange={handleFilterChange}
            className="input"
          />
          <button onClick={handleSortChange} className="btn">
            Sort by date {sort === 'asc' ? '↑' : '↓'}
          </button>
        </div>
        <div className="grid grid-cols-1 gap-4">
          {filteredAndSortedReceipts.map((receipt) => (
            <div key={receipt.id} className="p-4 border rounded-lg">
              <h2 className="font-semibold">{receipt.name}</h2>
              <p>{receipt.description}</p>
              <p className="text-sm text-gray-500">{receipt.date}</p>
            </div>
          ))}
        </div>
        <button className="btn btn-primary">
          <Plus className="w-4 h-4 mr-2" />
          Add Receipt
        </button>
      </div>
    </Layout>
  );
};

export default Receipts;

const dummyReceipts = [
  {
    id: 1,
    name: 'Receipt 1',
    description: 'Description for receipt 1',
    date: '2023-10-01',
  },
  {
    id: 2,
    name: 'Receipt 2',
    description: 'Description for receipt 2',
    date: '2023-09-15',
  },
  {
    id: 3,
    name: 'Receipt 3',
    description: 'Description for receipt 3',
    date: '2023-08-20',
  },
];
