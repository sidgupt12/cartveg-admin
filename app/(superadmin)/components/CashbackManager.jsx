// app/components/CashbackManager.jsx
'use client';
import { cashbackService } from '@/services/SuperService';
import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { AlertCircle, Plus } from 'lucide-react';

const CashbackManager = () => {
  const [cashbacks, setCashbacks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Fetch cashbacks on mount
  useEffect(() => {
    fetchCashbacks();
  }, []);

  const fetchCashbacks = async () => {
    setLoading(true);
    try {
      const response = await cashbackService.getCashbacks();
      // Check if response has a cashback array, indicating success
      if (response.cashback && Array.isArray(response.cashback)) {
        setCashbacks(response.cashback);
        setError(null);
      } else {
        setError(response.message || 'Failed to fetch cashbacks');
      }
    } catch (err) {
      setError('Error fetching cashbacks: ' + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Cashback Form Component (for Create)
  const CashbackForm = ({ onSubmit }) => {
    const [formData, setFormData] = useState({
      min_purchase_amount: '',
      cashback_amount: '',
      description: '',
      isActive: true,
    });
    const [formError, setFormError] = useState(null);
    const [formLoading, setFormLoading] = useState(false);

    const handleChange = (e) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleToggleActive = (checked) => {
      setFormData((prev) => ({ ...prev, isActive: checked }));
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      setFormLoading(true);
      setFormError(null);
      try {
        const data = {
          min_purchase_amount: parseFloat(formData.min_purchase_amount) || 0,
          cashback_amount: parseFloat(formData.cashback_amount) || 0,
          description: formData.description,
          isActive: formData.isActive,
        };

        await cashbackService.createCashback(data);
        await fetchCashbacks();
        onSubmit();
      } catch (err) {
        setFormError('Error creating cashback: ' + err.message);
        console.error(err);
      } finally {
        setFormLoading(false);
      }
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        {formError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        )}
        <div className="space-y-2">
          <Label htmlFor="min_purchase_amount" className="text-sm font-medium text-gray-700">
            Minimum Purchase Amount (₹)
          </Label>
          <Input
            type="number"
            id="min_purchase_amount"
            name="min_purchase_amount"
            value={formData.min_purchase_amount}
            onChange={handleChange}
            required
            min="0"
            step="0.01"
            className="rounded-md border-gray-300 focus:border-green-500 focus:ring-green-500"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cashback_amount" className="text-sm font-medium text-gray-700">
            Cashback Amount (₹)
          </Label>
          <Input
            type="number"
            id="cashback_amount"
            name="cashback_amount"
            value={formData.cashback_amount}
            onChange={handleChange}
            required
            min="0"
            step="0.01"
            className="rounded-md border-gray-300 focus:border-green-500 focus:ring-green-500"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description" className="text-sm font-medium text-gray-700">
            Description
          </Label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            rows="4"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">Status</Label>
          <div className="flex items-center space-x-2">
            <Switch
              checked={formData.isActive}
              onCheckedChange={handleToggleActive}
              className="data-[state=checked]:bg-green-500"
            />
            <span
              className={`text-xs font-semibold ${
                formData.isActive ? 'text-green-700' : 'text-gray-500'
              }`}
            >
              {formData.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
        <DialogFooter className="flex justify-end space-x-3">
          <Button
            type="button"
            variant="outline"
            onClick={onSubmit}
            className="px-4 py-2 border-gray-300 text-gray-700 hover:bg-gray-100"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={formLoading}
            className={`px-4 py-2 ${
              formLoading ? 'bg-green-300 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
            } text-white`}
          >
            {formLoading ? 'Saving...' : 'Create Cashback'}
          </Button>
        </DialogFooter>
      </form>
    );
  };

  // Cashback List Component
  const CashbackList = () => {
    const handleToggleStatus = async (cashback) => {
      const originalCashbacks = [...cashbacks];
      const updatedCashbacks = cashbacks.map((c) =>
        c._id === cashback._id ? { ...c, isActive: !c.isActive } : c
      );
      setCashbacks(updatedCashbacks); // Optimistic UI update
      setError(null);

      try {
        await cashbackService.updateCashbackStatus({
          id: cashback._id,
          isActive: !cashback.isActive,
        });
      } catch (err) {
        setError('Error toggling cashback status: ' + err.message);
        console.error(err);
        setCashbacks(originalCashbacks); // Revert on error
      }
    };

    return (
      <div className="mt-6">
        {loading && <p className="text-center text-gray-500 py-4">Loading cashbacks...</p>}
        {error && !loading && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
            <Button
              variant="ghost"
              onClick={() => setError(null)}
              className="absolute top-2 right-2 text-red-500 hover:text-red-700"
            >
              <span className="text-xl">×</span>
            </Button>
          </Alert>
        )}
        {!loading && cashbacks.length === 0 && !error && (
          <p className="text-center text-gray-500 py-4">No cashbacks found. Create one to get started!</p>
        )}
        {cashbacks.length > 0 && (
          <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm">
            <table className="min-w-full bg-white">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Min Purchase (₹)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cashback (₹)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created At
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Updated At
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {cashbacks.map((cashback) => (
                  <tr key={cashback._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {cashback._id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {cashback.min_purchase_amount?.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {cashback.cashback_amount?.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{cashback.description}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {new Date(cashback.createdAt).toLocaleString('en-US', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {new Date(cashback.updatedAt).toLocaleString('en-US', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={cashback.isActive}
                          onCheckedChange={() => handleToggleStatus(cashback)}
                          className="data-[state=checked]:bg-green-500"
                        />
                        <span
                          className={`text-xs font-semibold ${
                            cashback.isActive ? 'text-green-700' : 'text-gray-500'
                          }`}
                        >
                          {cashback.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  // Main Component Render
  return (
    <div className="max-w-7xl mx-auto p-6 md:p-8 bg-white min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Cashback Management</h1>
        <Button
          onClick={() => {
            setError(null);
            setIsCreateModalOpen(true);
          }}
          className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Cashback
        </Button>
      </div>

      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-md rounded-lg border border-gray-200 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-green-600">
              Create New Cashback
            </DialogTitle>
          </DialogHeader>
          <CashbackForm onSubmit={() => setIsCreateModalOpen(false)} />
        </DialogContent>
      </Dialog>

      {loading ? (
        <p className="text-center text-gray-500 py-10">Loading...</p>
      ) : (
        <CashbackList />
      )}
    </div>
  );
};

export default CashbackManager;