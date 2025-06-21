import React, { useState, useEffect } from 'react';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ShoppingCartIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import { authFetch, formatRupiah } from '../utils/authFetch';

interface Addon {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  imageUrl: string;
  category: string;
  status: 'active' | 'inactive';
  isActive: boolean;
}

export default function Addons() {
  const [addons, setAddons] = useState<Addon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAddon, setSelectedAddon] = useState<Addon | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    category: '',
    imageUrl: '',
    isActive: true,
  });

  useEffect(() => {
    fetchAddons();
  }, []);

  const fetchAddons = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await authFetch('/api/addons');
      if (!response.ok) throw new Error('Failed to fetch add-ons');
      const data = await response.json();
      setAddons(data.map((addon: any) => ({
        ...addon,
        id: addon.addOnId,
      })));
    } catch (error) {
      console.error('Error fetching add-ons:', error);
      setError('Failed to load add-ons. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        category: formData.category,
        imageUrl: formData.imageUrl,
        isActive: formData.isActive,
      };
      const url = selectedAddon ? `/api/addons/${selectedAddon.id}` : '/api/addons';
      const method = selectedAddon ? 'PUT' : 'POST';

      const response = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to ${selectedAddon ? 'update' : 'create'} add-on`);
      }

      setIsModalOpen(false);
      setTimeout(() => fetchAddons(), 3000);
    } catch (error: any) {
      console.error('Error saving add-on:', error);
      setError(error.message || 'Failed to save add-on. Please try again.');
    }
  };

  const handleEdit = (addon: Addon) => {
    setSelectedAddon(addon);
    setFormData({
      name: addon.name || '',
      description: addon.description || '',
      price: addon.price?.toString() || '',
      stock: addon.stock?.toString() || '',
      category: addon.category || '',
      imageUrl: addon.imageUrl || '',
      isActive: addon.isActive,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (addonId: number) => {
    if (window.confirm('Are you sure you want to delete this add-on?')) {
      try {
        const response = await authFetch(`/api/addons/${addonId}`, {
          method: 'DELETE',
        });
        if (!response.ok) throw new Error('Failed to delete add-on');
        setTimeout(() => fetchAddons(), 3000);
      } catch (error) {
        console.error('Error deleting add-on:', error);
        setError('Failed to delete add-on. Please try again.');
      }
    }
  };

  const handleStatusToggle = async (addon: Addon) => {
    try {
      const response = await authFetch(`/api/addons/${addon.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !addon.isActive }),
      });
      if (!response.ok) throw new Error('Failed to update status');

      // Optimistically update UI
      setAddons(addons.map(a =>
        a.id === addon.id
          ? { ...a, isActive: !a.isActive, status: a.status === 'active' ? 'inactive' : 'active' }
          : a
      ));
    } catch (error) {
      console.error('Error toggling addon status:', error);
      setError('Failed to update status. Please try again.');
    }
  };

  const activeAddons = addons.filter(a => a.status === 'active').length;
  const outOfStockAddons = addons.filter(a => a.stock === 0).length;
  const stats = [
    { name: 'Total Add-ons', value: addons.length, icon: ShoppingCartIcon },
    { name: 'Active', value: activeAddons, icon: CheckCircleIcon },
    { name: 'Out of Stock', value: outOfStockAddons, icon: ExclamationCircleIcon },
  ];

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Loading add-ons...</div>;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="sm:flex sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Add-ons</h1>
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
                category: '',
                imageUrl: '',
                isActive: true,
              });
              setIsModalOpen(true);
            }}
            className="btn-primary inline-flex items-center"
          >
            <PlusIcon className="mr-2 h-5 w-5" />
            Add Add-on
          </button>
        </div>
      </div>

      <div className="mt-8">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {stats.map((item) => (
            <div
              key={item.name}
              className="transform overflow-hidden rounded-xl bg-white bg-gradient-to-br from-white to-gray-50 shadow-lg transition-transform hover:scale-105"
            >
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex flex-col space-y-2">
                    <p className="text-md font-medium text-gray-500">{item.name}</p>
                    <p className="text-4xl font-bold text-gray-900">{item.value}</p>
                  </div>
                  <div className="rounded-full bg-primary-100 p-4">
                    <item.icon className="h-8 w-8 text-primary-600" aria-hidden="true" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      <div className="mt-8 flow-root">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Name</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Category</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Price</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Stock</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {addons.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-sm text-gray-500">
                        No add-ons found.
                      </td>
                    </tr>
                  ) : (
                    addons.map((addon) => (
                      <tr key={addon.id} className="hover:bg-gray-50">
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                          <div className="flex items-center">
                            <div className="h-10 w-10 flex-shrink-0">
                              <img
                                className="h-10 w-10 rounded-md object-cover"
                                src={addon.imageUrl || 'https://via.placeholder.com/40'}
                                alt={addon.name}
                                onError={(e) => { (e.target as any).src = 'https://via.placeholder.com/40'; }}
                              />
                            </div>
                            <div className="ml-4">
                              <div className="font-medium text-gray-900">{addon.name}</div>
                              <div className="text-gray-500">{addon.description}</div>
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                            {addon.category || 'General'}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-gray-900">
                          {formatRupiah(addon.price)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                              addon.stock > 10 ? 'bg-green-50 text-green-700 ring-green-600/20'
                              : addon.stock > 0 ? 'bg-yellow-50 text-yellow-800 ring-yellow-600/20'
                              : 'bg-red-50 text-red-700 ring-red-600/20'
                            }`}
                          >
                            {addon.stock > 0 ? `${addon.stock} in stock` : 'Out of stock'}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <button
                            onClick={() => handleStatusToggle(addon)}
                            className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium capitalize ring-1 ring-inset transition-colors ${
                              addon.status === 'active'
                                ? 'bg-green-50 text-green-700 ring-green-600/20 hover:bg-green-100'
                                : 'bg-red-50 text-red-700 ring-red-600/20 hover:bg-red-100'
                            }`}
                          >
                            {addon.status}
                          </button>
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <div className="flex items-center space-x-4">
                            <button onClick={() => handleEdit({ ...addon, id: addon.id })} className="text-gray-400 hover:text-indigo-600">
                              <PencilIcon className="h-5 w-5" />
                            </button>
                            <button onClick={() => handleDelete(addon.id)} className="text-gray-400 hover:text-red-600">
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
        </div>
      </div>

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
                  <div className="mt-4 grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-4">
                    <div className="sm:col-span-2">
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
                      <input type="text" name="name" id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="input-field mt-1" required placeholder="Enter add-on name" />
                    </div>
                    <div className="sm:col-span-2">
                      <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
                      <textarea name="description" id="description" rows={3} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="input-field mt-1" required placeholder="Enter add-on description" />
                    </div>
                    <div>
                      <label htmlFor="price" className="block text-sm font-medium text-gray-700">Price (IDR)</label>
                      <input type="number" name="price" id="price" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} className="input-field mt-1" required min="0" step="1000" placeholder="15000" />
                    </div>
                    <div>
                      <label htmlFor="stock" className="block text-sm font-medium text-gray-700">Stock</label>
                      <input type="number" name="stock" id="stock" value={formData.stock} onChange={(e) => setFormData({ ...formData, stock: e.target.value })} className="input-field mt-1" required min="0" placeholder="50" />
                    </div>
                    <div className="sm:col-span-2">
                      <label htmlFor="category" className="block text-sm font-medium text-gray-700">Category</label>
                      <input type="text" name="category" id="category" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="input-field mt-1" required placeholder="Food, Beverage, etc." />
                    </div>
                    <div className="sm:col-span-2">
                      <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700">Image URL</label>
                      <input type="url" name="imageUrl" id="imageUrl" value={formData.imageUrl} onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })} className="input-field mt-1" placeholder="https://example.com/image.jpg" />
                    </div>
                    <div className="sm:col-span-2">
                      <div className="relative flex items-start">
                        <div className="flex h-6 items-center">
                          <input id="isActive" name="isActive" type="checkbox" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600" />
                        </div>
                        <div className="ml-3 text-sm leading-6">
                          <label htmlFor="isActive" className="font-medium text-gray-900">Active</label>
                          <p className="text-gray-500">Uncheck to make this add-on unavailable for purchase.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                  <button type="submit" className="btn-primary sm:col-start-2">{selectedAddon ? 'Update' : 'Create'}</button>
                  <button type="button" className="btn-secondary mt-3 sm:col-start-1 sm:mt-0" onClick={() => setIsModalOpen(false)}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 