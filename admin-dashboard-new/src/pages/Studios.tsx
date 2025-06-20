import React, { useState, useEffect } from 'react';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { authFetch } from '../utils/authFetch';

interface Studio {
  id: number;
  name: string;
  capacity: number;
  layout: {
    rows: number;
    columns: number;
    seats: Array<{
      id: string;
      row: number;
      column: number;
      status: 'available' | 'reserved' | 'maintenance';
    }>;
  };
  status: 'active' | 'maintenance' | 'inactive';
}

export default function Studios() {
  const [studios, setStudios] = useState<Studio[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudio, setSelectedStudio] = useState<Studio | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    capacity: '',
    rows: '',
    columns: '',
    status: 'active',
  });

  useEffect(() => {
    fetchStudios();
  }, []);

  const fetchStudios = async () => {
    try {
      const response = await authFetch('/studios');
      if (!response.ok) throw new Error('Failed to fetch studios');
      const data = await response.json();
      // Map backend studioId to id for frontend
      setStudios(data.map((studio: any) => ({
        ...studio,
        id: studio.studioId,
      })));
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching studios:', error);
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const layout = {
        rows: parseInt(formData.rows),
        columns: parseInt(formData.columns),
        seats: Array.from({ length: parseInt(formData.rows) * parseInt(formData.columns) }, (_, i) => ({
          id: `seat-${i + 1}`,
          row: Math.floor(i / parseInt(formData.columns)) + 1,
          column: (i % parseInt(formData.columns)) + 1,
          status: 'available',
        })),
      };
      const payload = {
        ...formData,
        capacity: parseInt(formData.capacity),
        layout,
      };
      if (selectedStudio) {
        // Update studio
        const response = await authFetch(`/studios/${selectedStudio.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error('Failed to update studio');
      } else {
        // Create studio
        const response = await authFetch('/studios', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error('Failed to create studio');
      }
      setIsModalOpen(false);
      fetchStudios();
    } catch (error) {
      console.error('Error saving studio:', error);
    }
  };

  const handleEdit = (studio: Studio) => {
    setSelectedStudio(studio);
    setFormData({
      name: studio.name,
      capacity: studio.capacity.toString(),
      rows: studio.layout.rows.toString(),
      columns: studio.layout.columns.toString(),
      status: studio.status,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (studioId: number) => {
    if (window.confirm('Are you sure you want to delete this studio?')) {
      try {
        const response = await authFetch(`/studios/${studioId}`, {
          method: 'DELETE',
        });
        if (!response.ok) throw new Error('Failed to delete studio');
        fetchStudios();
      } catch (error) {
        console.error('Error deleting studio:', error);
      }
    }
  };

  const renderSeatLayout = (studio: Studio) => {
    const { rows, columns, seats } = studio.layout;
    return (
      <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
        {seats.map((seat) => (
          <div
            key={seat.id}
            className={`h-6 w-6 rounded-full flex items-center justify-center text-xs ${
              seat.status === 'available'
                ? 'bg-green-100 text-green-800'
                : seat.status === 'reserved'
                ? 'bg-red-100 text-red-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}
          >
            {seat.row}-{seat.column}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div>
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Studios</h1>
          <p className="mt-2 text-sm text-gray-700">
            A list of all cinema studios including their capacity and layout.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            type="button"
            onClick={() => {
              setSelectedStudio(null);
              setFormData({
                name: '',
                capacity: '',
                rows: '',
                columns: '',
                status: 'active',
              });
              setIsModalOpen(true);
            }}
            className="btn-primary inline-flex items-center"
          >
            <PlusIcon className="mr-2 h-5 w-5" />
            Add New
          </button>
        </div>
      </div>

      <div className="mt-8">
        <div className="table-container">
          <table className="table">
            <thead className="table-header">
              <tr>
                <th className="table-header-cell">Name</th>
                <th className="table-header-cell">Capacity</th>
                <th className="table-header-cell">Layout</th>
                <th className="table-header-cell">Status</th>
                <th className="table-header-cell">Actions</th>
              </tr>
            </thead>
            <tbody className="table-body">
              {studios.length === 0 ? (
                <tr className="table-row">
                  <td className="table-cell" colSpan={5}>
                    <div className="text-center text-gray-500 py-4">
                      {isLoading ? 'Loading...' : 'No studios found'}
                    </div>
                  </td>
                </tr>
              ) : (
                studios.map((studio) => (
                  <tr key={studio.id} className="table-row">
                    <td className="table-cell font-medium text-gray-900">{studio.name}</td>
                    <td className="table-cell">{studio.capacity}</td>
                    <td className="table-cell">
                      <div className="max-w-xs overflow-x-auto">
                        {renderSeatLayout(studio)}
                      </div>
                    </td>
                    <td className="table-cell">
                      <span
                        className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                          studio.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : studio.status === 'maintenance'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {studio.status}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div className="flex space-x-3">
                        <button
                          onClick={() => handleEdit(studio)}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(studio.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Studio Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />

            <div className="inline-block transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6 sm:align-middle">
              <form onSubmit={handleSubmit}>
                <div>
                  <h3 className="text-lg font-medium leading-6 text-gray-900">
                    {selectedStudio ? 'Edit Studio' : 'Add New Studio'}
                  </h3>
                  <div className="mt-4 space-y-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                        Name
                      </label>
                      <input
                        type="text"
                        name="name"
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="input-field mt-1"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="capacity" className="block text-sm font-medium text-gray-700">
                        Capacity
                      </label>
                      <input
                        type="number"
                        name="capacity"
                        id="capacity"
                        value={formData.capacity}
                        onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                        className="input-field mt-1"
                        required
                        min="1"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="rows" className="block text-sm font-medium text-gray-700">
                          Rows
                        </label>
                        <input
                          type="number"
                          name="rows"
                          id="rows"
                          value={formData.rows}
                          onChange={(e) => setFormData({ ...formData, rows: e.target.value })}
                          className="input-field mt-1"
                          required
                          min="1"
                        />
                      </div>

                      <div>
                        <label htmlFor="columns" className="block text-sm font-medium text-gray-700">
                          Columns
                        </label>
                        <input
                          type="number"
                          name="columns"
                          id="columns"
                          value={formData.columns}
                          onChange={(e) => setFormData({ ...formData, columns: e.target.value })}
                          className="input-field mt-1"
                          required
                          min="1"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                        Status
                      </label>
                      <select
                        name="status"
                        id="status"
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="input-field mt-1"
                        required
                      >
                        <option value="active">Active</option>
                        <option value="maintenance">Maintenance</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                  <button
                    type="submit"
                    className="btn-primary sm:col-start-2"
                  >
                    {selectedStudio ? 'Update' : 'Create'}
                  </button>
                  <button
                    type="button"
                    className="btn-secondary mt-3 sm:col-start-1 sm:mt-0"
                    onClick={() => setIsModalOpen(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 