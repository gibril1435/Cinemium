import React, { useState, useEffect } from 'react';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { authFetch } from '../utils/authFetch';

interface Price {
  id: number;
  type: 'default' | 'custom';
  price: number;
  startDate?: string;
  endDate?: string;
  dayOfWeek?: number;
  isHoliday?: boolean;
  description?: string;
}

export default function Pricing() {
  const [prices, setPrices] = useState<Price[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPrice, setSelectedPrice] = useState<Price | null>(null);
  const [formData, setFormData] = useState({
    type: 'default',
    price: '',
    startDate: '',
    endDate: '',
    dayOfWeek: '',
    isHoliday: false,
    description: '',
  });

  useEffect(() => {
    fetchPrices();
  }, []);

  const fetchPrices = async () => {
    try {
      const response = await authFetch('/api/admin/prices');
      if (!response.ok) throw new Error('Failed to fetch prices');
      const data = await response.json();
      setPrices(data);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching prices:', error);
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const priceData = {
        ...formData,
        price: parseFloat(formData.price),
        dayOfWeek: formData.dayOfWeek ? parseInt(formData.dayOfWeek) : undefined,
      };
      if (selectedPrice) {
        // Update price
        const response = await authFetch(`/api/admin/prices/${selectedPrice.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(priceData),
        });
        if (!response.ok) throw new Error('Failed to update price');
      } else {
        // Create price
        const response = await authFetch('/api/admin/prices', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(priceData),
        });
        if (!response.ok) throw new Error('Failed to create price');
      }
      setIsModalOpen(false);
      fetchPrices();
    } catch (error) {
      console.error('Error saving price:', error);
    }
  };

  const handleEdit = (price: Price) => {
    setSelectedPrice(price);
    setFormData({
      type: price.type,
      price: price.price.toString(),
      startDate: price.startDate || '',
      endDate: price.endDate || '',
      dayOfWeek: price.dayOfWeek?.toString() || '',
      isHoliday: price.isHoliday || false,
      description: price.description || '',
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (priceId: number) => {
    if (window.confirm('Are you sure you want to delete this price?')) {
      try {
        const response = await authFetch(`/api/admin/prices/${priceId}`, {
          method: 'DELETE',
        });
        if (!response.ok) throw new Error('Failed to delete price');
        fetchPrices();
      } catch (error) {
        console.error('Error deleting price:', error);
      }
    }
  };

  const getDayName = (day: number) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[day];
  };

  return (
    <div>
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Pricing</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage ticket prices including default and custom pricing rules.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            type="button"
            onClick={() => {
              setSelectedPrice(null);
              setFormData({
                type: 'default',
                price: '',
                startDate: '',
                endDate: '',
                dayOfWeek: '',
                isHoliday: false,
                description: '',
              });
              setIsModalOpen(true);
            }}
            className="btn-primary inline-flex items-center"
          >
            <PlusIcon className="mr-2 h-5 w-5" />
            Add Price
          </button>
        </div>
      </div>

      <div className="mt-8">
        <div className="table-container">
          <table className="table">
            <thead className="table-header">
              <tr>
                <th className="table-header-cell">Type</th>
                <th className="table-header-cell">Price</th>
                <th className="table-header-cell">Date Range</th>
                <th className="table-header-cell">Day</th>
                <th className="table-header-cell">Holiday</th>
                <th className="table-header-cell">Description</th>
                <th className="table-header-cell">Actions</th>
              </tr>
            </thead>
            <tbody className="table-body">
              {prices.length === 0 ? (
                <tr className="table-row">
                  <td className="table-cell" colSpan={7}>
                    <div className="text-center text-gray-500 py-4">
                      {isLoading ? 'Loading...' : 'No prices found'}
                    </div>
                  </td>
                </tr>
              ) : (
                prices.map((price) => (
                  <tr key={price.id} className="table-row">
                    <td className="table-cell">
                      <span
                        className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                          price.type === 'default'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}
                      >
                        {price.type}
                      </span>
                    </td>
                    <td className="table-cell">${price.price}</td>
                    <td className="table-cell">
                      {price.startDate && price.endDate
                        ? `${new Date(price.startDate).toLocaleDateString()} - ${new Date(
                            price.endDate
                          ).toLocaleDateString()}`
                        : '-'}
                    </td>
                    <td className="table-cell">
                      {price.dayOfWeek !== undefined ? getDayName(price.dayOfWeek) : '-'}
                    </td>
                    <td className="table-cell">
                      {price.isHoliday ? (
                        <span className="inline-flex rounded-full px-2 text-xs font-semibold leading-5 bg-red-100 text-red-800">
                          Yes
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="table-cell">{price.description || '-'}</td>
                    <td className="table-cell">
                      <div className="flex space-x-3">
                        <button
                          onClick={() => handleEdit(price)}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(price.id)}
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

      {/* Price Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />

            <div className="inline-block transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6 sm:align-middle">
              <form onSubmit={handleSubmit}>
                <div>
                  <h3 className="text-lg font-medium leading-6 text-gray-900">
                    {selectedPrice ? 'Edit Price' : 'Add New Price'}
                  </h3>
                  <div className="mt-4 space-y-4">
                    <div>
                      <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                        Type
                      </label>
                      <select
                        name="type"
                        id="type"
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        className="input-field mt-1"
                        required
                      >
                        <option value="default">Default</option>
                        <option value="custom">Custom</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                        Price
                      </label>
                      <input
                        type="number"
                        name="price"
                        id="price"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        className="input-field mt-1"
                        required
                        min="0"
                        step="0.01"
                      />
                    </div>

                    {formData.type === 'custom' && (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                              Start Date
                            </label>
                            <input
                              type="date"
                              name="startDate"
                              id="startDate"
                              value={formData.startDate}
                              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                              className="input-field mt-1"
                            />
                          </div>

                          <div>
                            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                              End Date
                            </label>
                            <input
                              type="date"
                              name="endDate"
                              id="endDate"
                              value={formData.endDate}
                              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                              className="input-field mt-1"
                            />
                          </div>
                        </div>

                        <div>
                          <label htmlFor="dayOfWeek" className="block text-sm font-medium text-gray-700">
                            Day of Week
                          </label>
                          <select
                            name="dayOfWeek"
                            id="dayOfWeek"
                            value={formData.dayOfWeek}
                            onChange={(e) => setFormData({ ...formData, dayOfWeek: e.target.value })}
                            className="input-field mt-1"
                          >
                            <option value="">Any day</option>
                            <option value="0">Sunday</option>
                            <option value="1">Monday</option>
                            <option value="2">Tuesday</option>
                            <option value="3">Wednesday</option>
                            <option value="4">Thursday</option>
                            <option value="5">Friday</option>
                            <option value="6">Saturday</option>
                          </select>
                        </div>

                        <div>
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              name="isHoliday"
                              checked={formData.isHoliday}
                              onChange={(e) => setFormData({ ...formData, isHoliday: e.target.checked })}
                              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                            />
                            <span className="ml-2 text-sm text-gray-700">Holiday Price</span>
                          </label>
                        </div>

                        <div>
                          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                            Description
                          </label>
                          <input
                            type="text"
                            name="description"
                            id="description"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="input-field mt-1"
                            placeholder="e.g., Weekend Special, Holiday Rate"
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                  <button
                    type="submit"
                    className="btn-primary sm:col-start-2"
                  >
                    {selectedPrice ? 'Update' : 'Create'}
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