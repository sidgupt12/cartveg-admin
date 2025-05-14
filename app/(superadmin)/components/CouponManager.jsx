// app/components/CouponManager.jsx
'use client';
import { couponService } from '@/services/superservice';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Package, Percent } from "lucide-react";

const CouponManager = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState(null);

  // Fetch coupons on mount
  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const response = await couponService.getCoupons();
      if (response.success) {
        setCoupons(response.coupons);
        setError(null);
      } else {
        setError(response.message || 'Failed to fetch coupons');
      }
    } catch (err) {
      setError('Error fetching coupons: ' + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Coupon Form Component (for Create and Update) - No changes here from previous version
  const CouponForm = ({ onSubmit, initialData = {}, isUpdate = false }) => {
    const [formData, setFormData] = useState({
      code: initialData.couponCode || '',
      expiry: initialData.expiry ? new Date(initialData.expiry).toISOString().split('T')[0] : '',
      minValue: initialData.minValue || '',
      maxUsage: initialData.maxUsage || '',
      offValue: initialData.offValue || '',
      couponType: initialData.couponType || 'MaxUsage',
      minOrders: initialData.minOrders || '',
    });
    const [formError, setFormError] = useState(null);
    const [formLoading, setFormLoading] = useState(false);

    const handleChange = (name, value) => {
      setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      setFormLoading(true);
      setFormError(null);
      try {
        const data = {
          code: formData.code,
          expiry: new Date(formData.expiry).toISOString(),
          minValue: parseFloat(formData.minValue) || 0,
          maxUsage: parseInt(formData.maxUsage) || 1,
          offValue: parseFloat(formData.offValue) || 0,
          couponType: formData.couponType,
          ...(formData.couponType === 'MinOrders' && { minOrders: parseInt(formData.minOrders) || 0 }),
        };
        
        if (isUpdate) {
          data.id = initialData._id;
          await couponService.updateCoupon(data);
        } else {
          await couponService.createCoupon(data);
        }
        await fetchCoupons();
        onSubmit();
      } catch (err) {
        setFormError(err.message || 'An error occurred');
      } finally {
        setFormLoading(false);
      }
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        {formError && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
            {formError}
          </div>
        )}

        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Label htmlFor="couponType" className="text-base font-medium">Coupon Type</Label>
              <Select
                value={formData.couponType}
                onValueChange={(value) => handleChange('couponType', value)}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select coupon type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MaxUsage">
                    <div className="flex items-center gap-2">
                      <Percent className="h-4 w-4" />
                      <span>Normal Coupon</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="MinOrders">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      <span>Minimum Orders</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Label htmlFor="code" className="text-base font-medium">Coupon Code</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => handleChange('code', e.target.value)}
                placeholder="Enter coupon code"
                required
                className="mt-2"
              />
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-medium">Basic Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="expiry">Expiry Date</Label>
                  <Input
                    type="date"
                    id="expiry"
                    value={formData.expiry}
                    onChange={(e) => handleChange('expiry', e.target.value)}
                    required
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="minValue">Minimum Value (₹)</Label>
                  <Input
                    id="minValue"
                    type="number"
                    value={formData.minValue}
                    onChange={(e) => handleChange('minValue', e.target.value)}
                    placeholder="Enter minimum value"
                    required
                    min="0"
                    step="0.01"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="offValue">Discount Value (₹)</Label>
                  <Input
                    id="offValue"
                    type="number"
                    value={formData.offValue}
                    onChange={(e) => handleChange('offValue', e.target.value)}
                    placeholder="Enter discount value"
                    required
                    min="0"
                    step="0.01"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-medium">Usage Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="maxUsage">Maximum Usage</Label>
                  <Input
                    id="maxUsage"
                    type="number"
                    value={formData.maxUsage}
                    onChange={(e) => handleChange('maxUsage', e.target.value)}
                    placeholder="Enter maximum usage"
                    required
                    min="1"
                    step="1"
                  />
                </div>

                {formData.couponType === 'MinOrders' && (
                  <div className="space-y-2">
                    <Label htmlFor="minOrders">Minimum Orders Required</Label>
                    <Input
                      id="minOrders"
                      type="number"
                      value={formData.minOrders}
                      onChange={(e) => handleChange('minOrders', e.target.value)}
                      placeholder="Enter minimum orders"
                      required
                      min="1"
                      step="1"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onSubmit}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={formLoading}
            className="bg-green-600 hover:bg-green-700"
          >
            {formLoading ? (
              <div className="flex items-center">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Saving...
              </div>
            ) : (
              isUpdate ? 'Update Coupon' : 'Create Coupon'
            )}
          </Button>
        </div>
      </form>
    );
  };

  // Modal Component - UPDATED with border and green title
  const CouponDialog = ({ isOpen, onClose, children, title }) => {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-green-600">{title}</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            {children}
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  // Coupon List Component
  const CouponList = () => {
    // Optimistic UI update for toggle
    const handleToggleStatus = async (coupon) => {
        const originalCoupons = [...coupons];
        const updatedCoupons = coupons.map(c =>
            c._id === coupon._id ? { ...c, isActive: !c.isActive } : c
        );
        setCoupons(updatedCoupons); // Update UI immediately
        setError(null); // Clear previous errors

        try {
            await couponService.changeCouponStatus({
                id: coupon._id,
                isActive: !coupon.isActive,
            });
            // Success - UI already updated
        } catch (err) {
            setError('Error toggling coupon status: ' + err.message);
            console.error(err);
            setCoupons(originalCoupons); // Revert UI on error
        }
    };

    const handleEditCoupon = (coupon) => {
      setSelectedCoupon(coupon);
      setIsUpdateModalOpen(true);
    };

    // Toggle Switch Sub-component - No changes needed here
    const ToggleSwitch = ({ isActive, onToggle }) => (
        <button
            type="button"
            onClick={onToggle}
            className={`relative inline-flex items-center h-6 rounded-full w-11 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500`}
            role="switch"
            aria-checked={isActive}
        >
            <span className="sr-only">Toggle Coupon Status</span>
            <span className={`${
                isActive ? 'bg-green-500' : 'bg-gray-300'
                } absolute inline-block w-full h-full rounded-full transition-colors ease-in-out duration-200`}
            />
            <span className={`${
                isActive ? 'translate-x-6' : 'translate-x-1'
                } absolute inline-block w-4 h-4 transform bg-white rounded-full transition-transform ease-in-out duration-200 shadow`}
            />
        </button>
    );


    return (
      <div className="mt-6">
        {/* Global Loading/Error display */}
        {loading && <p className="text-center text-gray-500 py-4">Loading coupons...</p>}
        {error && !loading && (
             <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                <strong className="font-bold">Error: </strong>
                <span className="block sm:inline">{error}</span>
                 <button onClick={() => setError(null)} className="absolute top-0 bottom-0 right-0 px-4 py-3" aria-label="Close error">
                     <span className="text-red-700 text-xl">&times;</span>
                 </button>
             </div>
        )}


        {!loading && coupons.length === 0 && !error && (
          <p className="text-center text-gray-500 py-4">No coupons found. Create one to get started!</p>
        )}

        {coupons.length > 0 && (
          <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm">
            <table className="min-w-full bg-white">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Discount (₹)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Min Value (₹)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Max Usage</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Min Orders</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiry</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {coupons.map((coupon) => (
                  <tr key={coupon._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{coupon.couponCode}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Badge 
                        variant={coupon.couponType === 'MinOrders' ? 'secondary' : 'outline'} 
                        className={`flex items-center gap-1 ${
                          coupon.couponType === 'MinOrders' 
                            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' 
                            : 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                        }`}
                      >
                        {coupon.couponType === 'MinOrders' ? (
                          <>
                            <Package className="h-3 w-3" />
                            Min Orders
                          </>
                        ) : (
                          <>
                            <Percent className="h-3 w-3" />
                            Normal
                          </>
                        )}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{coupon.offValue?.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{coupon.minValue?.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{coupon.maxUsage}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {coupon.couponType === 'MinOrders' ? coupon.minOrders : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {new Date(coupon.expiry).toLocaleDateString('en-CA')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center space-x-2">
                        <ToggleSwitch
                          isActive={coupon.isActive}
                          onToggle={() => handleToggleStatus(coupon)}
                        />
                        <span className={`text-xs font-semibold ${
                          coupon.isActive ? 'text-green-700' : 'text-gray-500'
                        }`}>
                          {coupon.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditCoupon(coupon)}
                        className="text-green-600 hover:text-green-800"
                      >
                        Edit
                      </Button>
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

  // Main Component Render - No changes here from previous version
  return (
    <div className="max-w-7xl mx-auto p-6 md:p-8 bg-white min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Coupon Management</h1>
        <Button
          onClick={() => {
            setSelectedCoupon(null);
            setError(null);
            setIsCreateModalOpen(true);
          }}
          className="bg-green-600 hover:bg-green-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Coupon
        </Button>
      </div>

       {/* Display global error messages outside the list */}
       {error && !loading && ( // Only show global error if not form error handled inside modal
         <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
             <span className="block sm:inline">{error}</span>
             <button onClick={() => setError(null)} className="absolute top-0 bottom-0 right-0 px-4 py-3" aria-label="Close error">
                 <span className="text-red-700 text-xl">&times;</span>
             </button>
         </div>
       )}

      <CouponDialog
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Coupon"
      >
        <CouponForm
          onSubmit={() => setIsCreateModalOpen(false)}
          key={`create-${Date.now()}`}
        />
      </CouponDialog>

      <CouponDialog
        isOpen={isUpdateModalOpen}
        onClose={() => {
          setIsUpdateModalOpen(false);
          setSelectedCoupon(null);
        }}
        title="Update Coupon"
      >
        {selectedCoupon && (
          <CouponForm
            onSubmit={() => {
              setIsUpdateModalOpen(false);
              setSelectedCoupon(null);
            }}
            initialData={selectedCoupon}
            isUpdate={true}
            key={selectedCoupon._id}
          />
        )}
      </CouponDialog>

      {/* Render loading indicator OR the list */}
       {loading ? <p className="text-center text-gray-500 py-10">Loading...</p> : <CouponList />}
    </div>
  );
};

export default CouponManager;