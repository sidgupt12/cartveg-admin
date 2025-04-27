// app/components/CouponManager.jsx
'use client';
import { couponService } from '@/services/superservice';
import { useState, useEffect } from 'react';

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
    });
    const [formError, setFormError] = useState(null); // Form-specific error state
    const [formLoading, setFormLoading] = useState(false); // Form-specific loading state


    const handleChange = (e) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormLoading(true);
        setFormError(null);
        try {
          const data = {
            code: formData.code,  // Changed from couponCode to code
            expiry: formData.expiry,
            minValue: parseFloat(formData.minValue) || 0,
            maxUsage: parseInt(formData.maxUsage) || 1,
            offValue: parseFloat(formData.offValue) || 0,
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
          // Error handling remains the same
        } finally {
          setFormLoading(false);
        }
      };


    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Display form-specific error */}
        {formError && <p className="text-red-500 text-sm mb-4">{formError}</p>}
        <div>
          <label htmlFor="code" className="block text-sm font-medium text-gray-700">Coupon Code</label>
          <input
            type="text"
            id="code"
            name="code"
            value={formData.code}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
          />
        </div>
        <div>
          <label htmlFor="expiry" className="block text-sm font-medium text-gray-700">Expiry Date</label>
          <input
            type="date"
            id="expiry"
            name="expiry"
            value={formData.expiry}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
          />
        </div>
        <div>
          <label htmlFor="minValue" className="block text-sm font-medium text-gray-700">Minimum Value (₹)</label>
          <input
            type="number"
            id="minValue"
            name="minValue"
            value={formData.minValue}
            onChange={handleChange}
            required
            min="0"
            step="0.01"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
          />
        </div>
        <div>
          <label htmlFor="maxUsage" className="block text-sm font-medium text-gray-700">Max Usage</label>
          <input
            type="number"
            id="maxUsage"
            name="maxUsage"
            value={formData.maxUsage}
            onChange={handleChange}
            required
            min="1"
            step="1"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
          />
        </div>
        <div>
          <label htmlFor="offValue" className="block text-sm font-medium text-gray-700">Discount Value (₹)</label>
          <input
            type="number"
            id="offValue"
            name="offValue"
            value={formData.offValue}
            onChange={handleChange}
            required
            min="0"
            step="0.01"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
          />
        </div>
        <div className="flex justify-end space-x-3 pt-2">
          <button
            type="button"
            onClick={onSubmit}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={formLoading} // Use form-specific loading state
            className={`px-4 py-2 rounded-md text-white ${
              formLoading ? 'bg-green-300 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600'
            } focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-1`}
          >
            {formLoading ? 'Saving...' : (isUpdate ? 'Update Coupon' : 'Create Coupon')}
          </button>
        </div>
      </form>
    );
  };

  // Modal Component - UPDATED with border and green title
  const Modal = ({ isOpen, onClose, children, title }) => {
    if (!isOpen) return null;

    return (
        <div
        className="fixed inset-0 bg-none bg-opacity-30 backdrop-blur-[2px] border border-gray-300 flex items-center justify-center z-50 p-4"
        onClick={onClose}
        >
        {/* Modal Content */}
        <div
          className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl relative border-2 border-gray-300"
          onClick={e => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="flex justify-between items-center mb-4 border-b pb-2">
             <h2 className="text-xl font-semibold text-green-600">{title}</h2>
             <button
                onClick={onClose}
                aria-label="Close modal"
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
             >
                &times;
             </button>
          </div>
          {/* Modal Body */}
          {children}
        </div>
      </div>
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Discount ($)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Min Value ($)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Max Usage</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiry</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {coupons.map((coupon) => (
                  <tr key={coupon._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{coupon.couponCode}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{coupon.offValue?.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{coupon.minValue?.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{coupon.maxUsage}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {new Date(coupon.expiry).toLocaleDateString('en-CA')}
                    </td>
                    {/* --- STATUS COLUMN UPDATED --- */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                       {/* Flex container to align toggle and text */}
                      <div className="flex items-center space-x-2">
                        <ToggleSwitch
                          isActive={coupon.isActive}
                          onToggle={() => handleToggleStatus(coupon)}
                        />
                         {/* Status text label */}
                        <span className={`text-xs font-semibold ${
                            coupon.isActive ? 'text-green-700' : 'text-gray-500' // Use gray for inactive for better contrast/less jarring than red
                          }`}
                        >
                          {coupon.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </td>
                    {/* --- END STATUS COLUMN UPDATE --- */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleEditCoupon(coupon)}
                        className="text-green-600 hover:text-green-800 hover:underline"
                      >
                        Edit
                      </button>
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
        <button
          onClick={() => {
              setSelectedCoupon(null);
              setError(null);
              setIsCreateModalOpen(true);
            }
          }
          className="px-5 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-1 transition duration-150 ease-in-out shadow-sm whitespace-nowrap"
        >
          + Create Coupon
        </button>
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

      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Coupon"
      >
        <CouponForm
          onSubmit={() => setIsCreateModalOpen(false)}
          key={`create-${Date.now()}`} // Ensures form resets if reopened quickly
        />
      </Modal>

      <Modal
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
                key={selectedCoupon._id} // Key ensures form state resets for different coupons
            />
        )}
      </Modal>

      {/* Render loading indicator OR the list */}
       {loading ? <p className="text-center text-gray-500 py-10">Loading...</p> : <CouponList />}
    </div>
  );
};

export default CouponManager;