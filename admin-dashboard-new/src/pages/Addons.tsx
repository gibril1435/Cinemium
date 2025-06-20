import React, { useState, useEffect } from 'react';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { authFetch } from '../utils/authFetch';

interface Addon {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  imageUrl: string;
  category: string;
  status: 'active' | 'inactive';
}

export default function Addons() {
  const [addons, setAddons] = useState<Addon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAddon, setSelectedAddon] = useState<Addon | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    imageUrl: '',
    category: '',
    status: 'active',
  });

  useEffect(() => {
    fetchAddons();
  }, []);

  const fetchAddons = async () => {
    try {
      const response = await authFetch('/addons');
      if (!response.ok) throw new Error('Failed to fetch add-ons');
      const data = await response.json();
      // Map backend addOnId to id for frontend
      setAddons(data.map((addon: any) => ({
        ...addon,
        id: addon.addOnId,
      })));
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching add-ons:', error);
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
      };
      if (selectedAddon) {
        // Update add-on
        const response = await authFetch(`/addons/${selectedAddon.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error('Failed to update add-on');
      } else {
        // Create add-on
        const response = await authFetch('/addons', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error('Failed to create add-on');
      }
      setIsModalOpen(false);
      fetchAddons();
    } catch (error) {
      console.error('Error saving add-on:', error);
    }
  };

  const handleEdit = (addon: Addon) => {
    setSelectedAddon(addon);
    setFormData({
      name: addon.name,
      description: addon.description,
      price: addon.price.toString(),
      stock: addon.stock.toString(),
      imageUrl: addon.imageUrl,
      category: addon.category,
      status: addon.status,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (addonId: number) => {
    if (window.confirm('Are you sure you want to delete this add-on?')) {
      try {
        const response = await authFetch(`/addons/${addonId}`, {
          method: 'DELETE',
        });
        if (!response.ok) throw new Error('Failed to delete add-on');
        fetchAddons();
      } catch (error) {
        console.error('Error deleting add-on:', error);
      }
    }
  };

  return (
    <div>
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Add-ons</h1>
          <p className="mt-2 text-sm text-gray-700">
            A list of all add-ons including their price, stock, and status.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            type="button"
            onClick={() => {
              setSelectedAddon(null);
              setFormData({
                name: '',
                description: '',
                price: '',
                stock: '',
                imageUrl: '',
                category: '',
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
                <th className="table-header-cell">Category</th>
                <th className="table-header-cell">Price</th>
                <th className="table-header-cell">Stock</th>
                <th className="table-header-cell">Status</th>
                <th className="table-header-cell">Actions</th>
              </tr>
            </thead>
            <tbody className="table-body">
              {addons.length === 0 ? (
                <tr className="table-row">
                  <td className="table-cell" colSpan={6}>
                    <div className="text-center text-gray-500 py-4">
                      {isLoading ? 'Loading...' : 'No add-ons found'}
                    </div>
                  </td>
                </tr>
              ) : (
                addons.map((addon) => (
                  <tr key={addon.id} className="table-row">
                    <td className="table-cell">
                      <div className="flex items-center">
                        {addon.imageUrl && (
                          <img
                            src={addon.imageUrl}
                            alt={addon.name}
                            className="h-10 w-10 rounded-full object-cover mr-3"
                          />
                        )}
                        <div>
                          <div className="font-medium text-gray-900">{addon.name}</div>
                          <div className="text-gray-500">{addon.description}</div>
                        </div>
                      </div>
                    </td>
                    <td className="table-cell">{addon.category}</td>
                    <td className="table-cell">${addon.price}</td>
                    <td className="table-cell">{addon.stock}</td>
                    <td className="table-cell">
                      <span
                        className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                          addon.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {addon.status}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div className="flex space-x-3">
                        <button
                          onClick={() => handleEdit(addon)}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(addon.id)}
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

      {/* Add-on Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />

            <div className="inline-block transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6 sm:align-middle">
              <form onSubmit={handleSubmit}>
                <div>
                  <h3 className="text-lg font-medium leading-6 text-gray-900">
                    {selectedAddon ? 'Edit Add-on' : 'Add New Add-on'}
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
                      <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                        Description
                      </label>
                      <textarea
                        name="description"
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="input-field mt-1"
                        rows={3}
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                        Category
                      </label>
                      <select
                        name="category"
                        id="category"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="input-field mt-1"
                        required
                      >
                        <option value="">Select a category</option>
                        <option value="food">Food</option>
                        <option value="drinks">Drinks</option>
                        <option value="snacks">Snacks</option>
                        <option value="merchandise">Merchandise</option>
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

                    <div>
                      <label htmlFor="stock" className="block text-sm font-medium text-gray-700">
                        Stock
                      </label>
                      <input
                        type="number"
                        name="stock"
                        id="stock"
                        value={formData.stock}
                        onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                        className="input-field mt-1"
                        required
                        min="0"
                      />
                    </div>

                    <div>
                      <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700">
                        Image URL
                      </label>
                      <input
                        type="url"
                        name="imageUrl"
                        id="imageUrl"
                        value={formData.imageUrl}
                        onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                        className="input-field mt-1"
                      />
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
                    {selectedAddon ? 'Update' : 'Create'}
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