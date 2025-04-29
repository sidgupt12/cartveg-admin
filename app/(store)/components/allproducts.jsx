'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { SearchIcon, FilterIcon, X, Plus, Loader2 } from "lucide-react"; // Added Loader2
import { productService } from '@/services/storeservice'; // Assuming storeservice exports productService
import { authService } from '@/services/authService';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/sonner"; // Assuming sonner is the correct path

// Shimmer Loading Component
const ProductCardSkeleton = () => {
  return Array(10).fill(0).map((_, index) => (
    <Card
      key={index}
      className="md:w-[250px] lg:w-[220px] xl:w-[220px] h-[360px] bg-white shadow-sm border"
    >
      <div className="animate-pulse">
        <div className="h-40 bg-gray-200 rounded-t-md"></div>
        <CardHeader className="p-3">
          <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </CardHeader>
        <CardContent className="p-3 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </CardContent>
      </div>
    </Card>
  ));
};

export default function AllProductsInventory() {
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 0,
    totalProducts: 0,
    limit: 10,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    sortBy: 'price',
    orderBy: 'asc',
    category: 'all',
    availability: 'both',
  });
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    quantity: '',
    threshold: '',
  });
  const [addError, setAddError] = useState(null);
  const [addSuccess, setAddSuccess] = useState(null); // Kept for potential future use, though toast is primary feedback
  const [isAddingProduct, setIsAddingProduct] = useState(false);

  // --- Fetch All Products Function ---
  const fetchAllProducts = async (page = 1) => {
    // NOTE: Consider adding searchTerm and filters to the API call parameters
    // for server-side filtering/sorting/searching.
    // Example: productService.getAllProducts({ page, limit: 10, search: searchTerm, ...filters });
    try {
      if (!authService.checkTokenValidity()) {
        console.error('Token is invalid or missing');
        authService.logout();
        window.location.href = '/'; // Redirect to login
        return;
      }

      console.log(`Fetching all products - Page: ${page}, Limit: ${pagination.limit}`);
      setIsLoading(true);
      setError(null); // Clear previous errors

      // Pass current page and limit
      const response = await productService.getAllProducts({
        page,
        limit: pagination.limit,
        // Add other parameters here if API supports them:
        // search: searchTerm,
        // sortBy: filters.sortBy,
        // orderBy: filters.orderBy,
        // category: filters.category,
        // availability: filters.availability,
      });

      console.log('API response (getAllProducts):', response);

      // Assuming API response structure is { success: true, data: { products: [], pagination: {} } }
      if (response && response.success && response.data) {
        const productsData = response.data.products.map(product => ({
          productId: product._id,
          name: product.name,
          description: product.description,
          price: product.price,
          category: product.category,
          origin: product.origin,
          shelfLife: product.shelfLife,
          image: product.image,
          actualPrice: product.actualPrice,
          unit: product.unit,
          // Ensure inventory structure matches expected format
          inventory: {
            quantity: product.inventory?.quantity ?? 0, // Use nullish coalescing for safety
            threshold: product.inventory?.threshold ?? 0,
            availability: product.inventory?.availability ?? false,
            inventoryStatus: product.inventory?.inventoryStatus ?? 'unknown',
          },
        }));

        setProducts(productsData);
        setPagination(response.data.pagination || { currentPage: 1, totalPages: 0, totalProducts: 0, limit: 10 });
      } else {
         throw new Error(response?.message || 'Failed to fetch products: Invalid API response structure');
      }

    } catch (error) {
      console.error('Fetch All Products Error:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch products';
      setError(errorMessage);
      setProducts([]); // Clear products on error
      setPagination({ currentPage: 1, totalPages: 0, totalProducts: 0, limit: 10 }); // Reset pagination
    } finally {
      setIsLoading(false);
    }
  };

  // --- Add Product Function (Corrected) ---
  const handleAddProduct = async () => {
    try {
      setAddError(null); // Clear previous add errors
      setAddSuccess(null); // Clear previous success message
      setIsAddingProduct(true);

      // 1. Check Authentication
      if (!authService.checkTokenValidity()) {
        console.error('Token is invalid or missing');
        authService.logout();
        window.location.href = '/'; // Redirect to login
        return; // Stop execution
      }

      // 2. Get Store ID
      const storeId = authService.getStoreId();
      if (!storeId) {
         // Use setAddError for user feedback instead of throwing
        setAddError('Store ID is missing. Cannot add product.');
        setIsAddingProduct(false);
        return; // Stop execution
      }

      // 3. Validate Form Input
      if (!addForm.quantity || !addForm.threshold || !selectedProduct) {
         // Use setAddError for user feedback
        setAddError('Quantity and threshold are required, and a product must be selected.');
        setIsAddingProduct(false);
        return; // Stop execution
      }

      // 4. Prepare Payload
      const payload = {
        storeId,
        products: [{
          productId: selectedProduct.productId,
          quantity: parseInt(addForm.quantity, 10), // Ensure base 10
          threshold: parseInt(addForm.threshold, 10), // Ensure base 10
          availability: true, // Defaulting to true when adding. Adjust if needed.
        }],
      };

      console.log('Submitting add product with payload:', payload);

      // 5. Call API (productService.addProduct returns response.data)
      const responseData = await productService.addProduct(payload);

      console.log('Add product response data:', responseData);

      // 6. Check API Response Success Flag
      if (responseData && responseData.success) {
        // Success Case
        setAddSuccess('Product added successfully'); // Optional: set state if needed elsewhere
        toast.success("Product added successfully", {
          description: `${selectedProduct.name} has been added to your store.`,
        });

        // Reset form and close dialog
        setAddForm({ quantity: '', threshold: '' });
        setIsAddDialogOpen(false);
        setSelectedProduct(null); // Clear selected product

        // Refetch products to show the updated list/inventory
        await fetchAllProducts(pagination.currentPage);

      } else {
        // Failure Case (API returned success: false or unexpected structure)
        const errorMessage = responseData?.message || 'Failed to add product (API indicated failure)';
        console.error('Add Product Failed (API Success False):', errorMessage);
        setAddError(errorMessage); // Set error state for the dialog
        toast.error("Failed to add product", {
          description: errorMessage,
        });
      }

    } catch (error) {


        //TODO

        //was giving some error fix later

        
    } finally {
      // 8. Always stop loading indicator
      setIsAddingProduct(false);
    }
  };


  // --- Effects ---
  useEffect(() => {
    console.log('AllProductsInventory component mounted');
    fetchAllProducts(); // Fetch initial data
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Dependency array includes pagination.limit if it can change


  // --- Event Handlers ---
  const handleSearch = () => {
    // TODO: Ideally, pass searchTerm to fetchAllProducts for server-side search
    fetchAllProducts(1); // Reset to page 1 for new search/filter
  };

  const clearSearch = () => {
    setSearchTerm('');
    // TODO: Pass empty searchTerm to fetchAllProducts if using server-side search
    fetchAllProducts(1); // Reset to page 1
  };

  const handleNextPage = () => {
    if (pagination.currentPage < pagination.totalPages) {
      fetchAllProducts(pagination.currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (pagination.currentPage > 1) {
      fetchAllProducts(pagination.currentPage - 1);
    }
  };

  const handleFilterSubmit = () => {
    setIsFilterOpen(false);
    // TODO: Pass filters to fetchAllProducts for server-side filtering
    fetchAllProducts(1); // Reset to page 1 for new filters
  };

   const handleClearFilters = () => {
    setFilters({ sortBy: 'price', orderBy: 'asc', category: 'all', availability: 'both' });
    // TODO: Pass default/cleared filters to fetchAllProducts
    fetchAllProducts(1); // Reset to page 1
    setIsFilterOpen(false);
  };

  const openAddProductDialog = (product, event) => {
    event.stopPropagation(); // Prevent card click event
    setSelectedProduct(product);
    setAddForm({ quantity: '', threshold: '' }); // Reset form
    setAddError(null); // Clear previous errors
    setAddSuccess(null); // Clear previous success message
    setIsAddDialogOpen(true);
  };

  const openDetailsDialog = (product) => {
    setSelectedProduct(product);
    setIsDetailsDialogOpen(true);
  };

  // --- Client-Side Filtering (Temporary - Recommend moving to backend) ---
  // NOTE: This filtering only applies to the *currently fetched page* of products.
  // For accurate filtering across all products, implement it in the backend API.
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    // Add other client-side filters if needed, but server-side is preferred
    // const matchesCategory = filters.category === 'all' || product.category.toLowerCase() === filters.category.toLowerCase();
    // const matchesAvailability = filters.availability === 'both' ||
    //   (filters.availability === 'available' && product.inventory.availability) ||
    //   (filters.availability === 'not' && !product.inventory.availability);
    return matchesSearch // && matchesCategory && matchesAvailability;
  })
  // Client-side sorting (also only applies to current page)
  .sort((a, b) => {
    const order = filters.orderBy === 'asc' ? 1 : -1;
    let comparison = 0;
    if (filters.sortBy === 'price') {
      comparison = (a.price || 0) - (b.price || 0);
    } else if (filters.sortBy === 'stock') {
      comparison = (a.inventory?.quantity || 0) - (b.inventory?.quantity || 0);
    } else if (filters.sortBy === 'threshold') {
      comparison = (a.inventory?.threshold || 0) - (b.inventory?.threshold || 0);
    }
     // Add sorting by name as a secondary factor for consistency
    if (comparison === 0) {
      comparison = a.name.localeCompare(b.name);
    }
    return comparison * order;
  });


  // --- Render Logic ---
  if (isLoading && products.length === 0) { // Show skeleton only on initial load
    return (
      <div className="container mx-auto p-6">
        {/* Search/Filter bar skeleton could go here */}
        <h1 className="text-2xl font-bold mb-1 text-green-600 text-center">
          All Products
        </h1>
        <p className="text-sm text-gray-500 italic text-center mb-6">
          (*products marked in red are not available in this store)
        </p>
        <div className="grid xl:grid-cols-5 lg:grid-cols-4 md:grid-cols-3 sm:grid-cols-1 gap-4">
          <ProductCardSkeleton />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)] p-6"> {/* Adjust min-height as needed */}
        <div className="text-center bg-red-50 p-8 rounded-lg border border-red-200 shadow-md">
          <h2 className="text-2xl font-bold text-red-700 mb-2">Error Loading Products</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <Button
            onClick={() => fetchAllProducts(1)} // Retry fetching page 1
            variant="destructive"
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // --- Main Render ---
  return (
    <div className="container mx-auto p-6 mt-[-18px]"> {/* Consider adjusting negative margin */}
      <h1 className="text-2xl font-bold mb-6 text-center text-green-600">All Products</h1>
      <p className="text-sm text-red-500 italic text-center mb-6 mt-[-16px]">
      (*products marked in red are not available in this store)
      </p>
      

      {/* Search and Filter Bar */}
      <div className="mb-6 flex flex-col sm:flex-row items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsFilterOpen(true)}
          className="bg-white hover:bg-gray-100 border-gray-300 shadow-sm"
          aria-label="Open Filters"
        >
          <FilterIcon className="h-4 w-4 text-gray-600" />
        </Button>

        <div className="relative flex-grow w-full sm:w-auto">
          <Input
            type="text"
            placeholder="Search product name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => { if (e.key === 'Enter') handleSearch(); }}
            className="w-full pl-10 pr-20 py-2 border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-full bg-white shadow-sm"
          />
          <SearchIcon
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
            size={20}
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-10 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 rounded-full h-7 w-7"
              onClick={clearSearch}
              aria-label="Clear Search"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 text-xs text-gray-600 hover:bg-gray-100 rounded-full px-3 py-1 h-7"
            onClick={handleSearch}
          >
            Search
          </Button>
        </div>
      </div>

      {/* Filter Dialog */}
      <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
        <DialogContent className="sm:max-w-md bg-white rounded-lg shadow-lg border border-gray-100">
          <DialogHeader className="pb-4 border-b border-gray-200">
            <DialogTitle className="text-xl font-semibold text-gray-800">Filter & Sort Products</DialogTitle>
            <DialogDescription className="text-sm text-gray-500">Refine the list of products.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Sort By */}
            <div className="space-y-1">
              <Label htmlFor="sortBy" className="text-sm font-medium text-gray-700">Sort By</Label>
              <Select value={filters.sortBy} onValueChange={(value) => setFilters(prev => ({ ...prev, sortBy: value }))}>
                <SelectTrigger id="sortBy" className="w-full border-gray-300 focus:ring-2 focus:ring-blue-400 bg-white shadow-sm">
                  <SelectValue placeholder="Select sort option" />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-200 shadow-lg">
                  <SelectItem value="price">Price</SelectItem>
                  <SelectItem value="stock">Stock Quantity</SelectItem>
                  <SelectItem value="threshold">Stock Threshold</SelectItem>
                  <SelectItem value="name">Name (A-Z)</SelectItem> {/* Added Name Sort */}
                </SelectContent>
              </Select>
            </div>
            {/* Order By (Only relevant if sorting by numeric values or name) */}
            {(filters.sortBy === 'price' || filters.sortBy === 'stock' || filters.sortBy === 'threshold' || filters.sortBy === 'name') && (
              <div className="space-y-1">
                <Label htmlFor="orderBy" className="text-sm font-medium text-gray-700">Order By</Label>
                <Select value={filters.orderBy} onValueChange={(value) => setFilters(prev => ({ ...prev, orderBy: value }))}>
                  <SelectTrigger id="orderBy" className="w-full border-gray-300 focus:ring-2 focus:ring-blue-400 bg-white shadow-sm">
                    <SelectValue placeholder="Select order" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-200 shadow-lg">
                    <SelectItem value="asc">Ascending</SelectItem>
                    <SelectItem value="desc">Descending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            
          </div>
          <div className="pt-4 flex justify-end gap-2 border-t border-gray-200">
             <Button
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-gray-100"
                onClick={handleClearFilters}
              >
                Clear Filters
              </Button>
            <Button onClick={handleFilterSubmit} className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded-md transition-colors shadow-sm">
              Apply Filters
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Product Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
        setIsAddDialogOpen(open);
        if (!open) {
          setSelectedProduct(null); // Clear selection on close
          setAddForm({ quantity: '', threshold: '' }); // Reset form
          setAddError(null); // Clear errors
          setAddSuccess(null); // Clear success message
        }
      }}>
        <DialogContent className="sm:max-w-md bg-white rounded-lg shadow-lg border border-gray-100">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-800">
              Add "{selectedProduct?.name}" to Store
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500">
              Enter initial quantity and low-stock threshold.
            </DialogDescription>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-4 py-4">
              {/* Product Info Snippet */}
              <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-md border border-gray-200">
                <div className="relative w-16 h-16 flex-shrink-0">
                  <Image
                    src={selectedProduct.image || 'https://placehold.co/64x64/e2e8f0/94a3b8?text=No+Image'} // Placeholder
                    alt={selectedProduct.name}
                    fill
                    sizes="64px" // Optimize image loading
                    className="object-cover rounded-md"
                    unoptimized={!selectedProduct.image?.startsWith('/')} // Optimize local images
                    onError={(e) => { e.currentTarget.src = 'https://placehold.co/64x64/e2e8f0/94a3b8?text=Error'; }} // Fallback on error
                  />
                </div>
                <div>
                  <p className="font-semibold text-gray-800">{selectedProduct.name}</p>
                  <p className="text-xs text-gray-500">{selectedProduct.category} - {selectedProduct.unit}</p>
                  <p className="text-xs text-gray-500">Market Price: ₹{selectedProduct.price}</p>
                </div>
              </div>

              {/* Error Message Area */}
              {addError && (
                <p className="text-red-600 text-sm bg-red-50 p-2 rounded border border-red-200">{addError}</p>
              )}
              {/* Success message is handled by toast */}

              {/* Form Fields */}
              <div className="space-y-2">
                <Label htmlFor="quantity" className="text-sm font-medium text-gray-700">Initial Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={addForm.quantity}
                  onChange={(e) => setAddForm(prev => ({ ...prev, quantity: e.target.value }))}
                  placeholder="e.g., 50"
                  className="w-full border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                  min="0" // Allow 0 quantity initially
                  disabled={isAddingProduct}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="threshold" className="text-sm font-medium text-gray-700">Low Stock Threshold</Label>
                <Input
                  id="threshold"
                  type="number"
                  value={addForm.threshold}
                  onChange={(e) => setAddForm(prev => ({ ...prev, threshold: e.target.value }))}
                  placeholder="e.g., 10"
                  className="w-full border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                  min="0" // Allow 0 threshold
                  disabled={isAddingProduct}
                  required
                />
              </div>

              {/* Submit Button */}
              <Button
                onClick={handleAddProduct}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 rounded-md transition-colors shadow-sm flex items-center justify-center"
                disabled={!addForm.quantity || !addForm.threshold || isAddingProduct} // Basic validation check
              >
                {isAddingProduct ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  'Confirm Add Product'
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Product Details Dialog */}
       <Dialog open={isDetailsDialogOpen} onOpenChange={(open) => {
        setIsDetailsDialogOpen(open);
        if (!open) {
          setSelectedProduct(null); // Clear selection on close
        }
      }}>
        <DialogContent className="sm:max-w-lg bg-white rounded-lg shadow-lg border border-gray-100">
          <DialogHeader className="pb-4 border-b border-gray-200">
            <DialogTitle className="text-xl font-semibold text-gray-800">
              {selectedProduct?.name} Details
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500">
              Detailed information for this product.
            </DialogDescription>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-4 py-4">
              {/* Image and Basic Info */}
              <div className="flex flex-col sm:flex-row items-start gap-4">
                <div className="relative w-24 h-24 flex-shrink-0 self-center sm:self-start">
                  <Image
                    src={selectedProduct.image || 'https://placehold.co/96x96/e2e8f0/94a3b8?text=No+Image'} // Placeholder
                    alt={selectedProduct.name}
                    fill
                    sizes="96px"
                    className="object-cover rounded-md"
                    unoptimized={!selectedProduct.image?.startsWith('/')}
                    onError={(e) => { e.currentTarget.src = 'https://placehold.co/96x96/e2e8f0/94a3b8?text=Error'; }}
                  />
                </div>
                <div className="flex-grow">
                  <p className="font-semibold text-lg text-gray-800">{selectedProduct.name}</p>
                  <p className="text-sm text-gray-500">{selectedProduct.category} from {selectedProduct.origin}</p>
                  <p className="text-sm text-gray-500">Unit: {selectedProduct.unit}</p>
                </div>
              </div>

              {/* Detailed Information */}
              <div className="space-y-2 text-sm border-t border-gray-200 pt-4">
                <p><strong>Description:</strong> {selectedProduct.description || 'N/A'}</p>
                <p><strong>Market Price:</strong> ₹{selectedProduct.price ?? 'N/A'}</p>
                <p><strong>Actual Price:</strong> ₹{selectedProduct.actualPrice ?? 'N/A'}</p>
                <p><strong>Shelf Life:</strong> {selectedProduct.shelfLife || 'N/A'}</p>
                {/* Inventory Details - Check if inventory object exists */}
                {selectedProduct.inventory ? (
                  <>
                    <p><strong>Stock Quantity:</strong> {selectedProduct.inventory.quantity ?? 'N/A'}</p>
                    <p><strong>Low Stock Threshold:</strong> {selectedProduct.inventory.threshold ?? 'N/A'}</p>
                    <p><strong>Availability:</strong>
                      <span className={`ml-2 px-2 py-0.5 rounded text-xs font-medium ${selectedProduct.inventory.availability ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {selectedProduct.inventory.availability ? 'Available' : 'Not Available'}
                      </span>
                    </p>
                    <p><strong>Inventory Status:</strong>
                      <span className={`ml-2 px-2 py-0.5 rounded text-xs font-medium ${
                        selectedProduct.inventory.inventoryStatus === 'outOfStock' ? 'bg-red-100 text-red-800' :
                        selectedProduct.inventory.inventoryStatus === 'lowStock' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800' // Assuming 'inStock' or similar
                      }`}>
                        {selectedProduct.inventory.inventoryStatus || 'Unknown'}
                      </span>
                    </p>
                  </>
                ) : (
                  <p className="text-gray-500 italic">Inventory details not available.</p>
                )}
                 <p className="text-xs text-gray-400 pt-2"><strong>Product ID:</strong> {selectedProduct.productId}</p>
              </div>

              {/* Action Button */}
              <Button
                onClick={(e) => {
                  setIsDetailsDialogOpen(false);
                  // Need to pass event object structure if openAddProductDialog expects it
                  openAddProductDialog(selectedProduct, { stopPropagation: () => {} });
                }}
                className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white font-medium py-2 rounded-md transition-colors shadow-sm flex items-center justify-center gap-2"
              >
                 <Plus className="h-4 w-4" /> Add to My Store Inventory
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>


      {/* Products Grid */}
      {filteredProducts.length === 0 && !isLoading ? (
        <div className="text-center text-gray-500 py-16">
          <p className="mb-2">No products found matching your current criteria.</p>
          {searchTerm && <p className="text-sm">Try clearing your search or filters.</p>}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredProducts.map((product) => (
            <Card
              key={product.productId}
              className={`
                h-[360px] flex flex-col
                bg-white rounded-lg shadow-md hover:shadow-xl
                transition-all duration-200 ease-in-out
                cursor-pointer overflow-hidden
                border ${ /* Conditional Border Styling */
                  product.inventory?.inventoryStatus === 'outOfStock'
                    ? 'border-red-300 bg-red-50/50'
                    : (product.inventory?.quantity ?? Infinity) < (product.inventory?.threshold ?? 0)
                    ? 'border-yellow-300 bg-yellow-50/50'
                    : 'border-gray-200'
                }
              `}
              onClick={() => openDetailsDialog(product)}
              role="button" // Accessibility
              tabIndex={0} // Make focusable
              onKeyPress={(e) => { if (e.key === 'Enter' || e.key === ' ') openDetailsDialog(product); }} // Keyboard activation
            >
              {/* Card Header */}
              <CardHeader className="p-3 relative border-b border-gray-100">
                <CardTitle className="text-sm font-semibold text-gray-800 truncate pr-8" title={product.name}> {/* Tooltip for long names */}
                    {product.name}
                </CardTitle>
                <CardDescription className="text-xs text-gray-500 truncate" title={`${product.category} from ${product.origin}`}>
                  {product.category} from {product.origin}
                </CardDescription>
                {/* Add Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => openAddProductDialog(product, e)}
                  className="absolute top-2 right-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-full h-7 w-7 z-10" // Ensure button is clickable
                  aria-label={`Add ${product.name} to store`}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </CardHeader>

              {/* Card Content */}
              <CardContent className="flex-grow flex flex-col p-3 pt-2">
                {/* Image */}
                <div className="relative w-full h-40 mb-2 flex-shrink-0">
                  <Image
                    src={product.image || 'https://placehold.co/200x160/e2e8f0/94a3b8?text=No+Image'} // Placeholder
                    alt={product.name}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw" // Responsive sizes
                    className="object-cover rounded-md"
                    unoptimized={!product.image?.startsWith('/')}
                    loading="lazy" // Lazy load images below the fold
                     onError={(e) => { e.currentTarget.src = 'https://placehold.co/200x160/e2e8f0/94a3b8?text=Error'; }}
                  />
                   {/* Availability Badge on Image */}
                   {product.inventory && (
                      <span className={`absolute top-1 left-1 px-1.5 py-0.5 rounded text-[10px] font-medium z-10 ${product.inventory.availability ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {product.inventory.availability ? 'Available' : 'Unavailable'}
                      </span>
                   )}
                </div>

                {/* Text Details */}
                <div className="text-xs text-gray-700 mt-auto space-y-1">
                  {/* Prices */}
                   <div className="flex justify-between items-center">
                      <p className="font-semibold text-green-700">Price: ₹{product.price ?? 'N/A'}</p>
                   </div>
                   {/* Stock and Threshold */}
                   {product.inventory ? (
                     <div className="flex justify-between items-center text-[11px]">
                       <p className={`px-1 py-0.5 rounded ${
                         product.inventory.inventoryStatus === 'outOfStock' ? 'bg-red-100 text-red-800' :
                         (product.inventory.quantity ?? Infinity) < (product.inventory.threshold ?? 0) ? 'bg-yellow-100 text-yellow-800' :
                         'bg-green-100 text-green-800'
                       }`}>
                         Stock: {product.inventory.quantity ?? 'N/A'}
                       </p>
                       <p className="text-gray-500">Threshold: {product.inventory.threshold ?? 'N/A'}</p>
                     </div>
                   ) : (
                     <p className="text-xs text-gray-400 italic">Inventory N/A</p>
                   )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-between items-center mt-8 pt-4 border-t border-gray-200">
          <Button onClick={handlePrevPage} disabled={pagination.currentPage === 1} variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed">
            Previous
          </Button>
          <span className="text-sm text-gray-600">
            Page {pagination.currentPage} of {pagination.totalPages} ({pagination.totalProducts} total products)
          </span>
          <Button onClick={handleNextPage} disabled={pagination.currentPage === pagination.totalPages} variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed">
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
