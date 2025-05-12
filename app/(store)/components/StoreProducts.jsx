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
import { SearchIcon, FilterIcon, X, Pencil, Loader2 } from "lucide-react";
import { productService } from '@/services/storeservice';
import { authService } from '@/services/authService';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

// Shimmer Loading Component
const ProductCardSkeleton = () => {
  return Array(12).fill(0).map((_, index) => (
    <Card
      key={index}
      className="h-[360px] flex flex-col bg-white rounded-lg shadow-md border border-gray-200"
    >
      <div className="animate-pulse">
        {/* Header */}
        <div className="p-3 border-b border-gray-100">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
        
        {/* Image */}
        <div className="p-3 pt-2">
          <div className="w-full h-40 bg-gray-200 rounded-md mb-2"></div>
          
          {/* Price and Stock */}
          <div className="space-y-2 mt-2">
            <div className="h-3 bg-gray-200 rounded w-1/3"></div>
            <div className="flex justify-between items-center">
              <div className="h-3 bg-gray-200 rounded w-1/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/4"></div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  ));
};

export default function StoreProducts() {
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 0,
    totalProducts: 0,
    limit: 12,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isPageLoading, setIsPageLoading] = useState(false);
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
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);
  const [updateForm, setUpdateForm] = useState({
    quantity: '',
    availability: true,
    threshold: '',
  });
  const [updateError, setUpdateError] = useState(null);
  const [updateSuccess, setUpdateSuccess] = useState(null);

  // Helper function to safely get current page from localStorage
  const getCurrentPage = () => {
    if (typeof window !== 'undefined') {
      return parseInt(localStorage.getItem('currentPage')) || 1;
    }
    return 1;
  };

  // Helper function to safely set current page in localStorage
  const setCurrentPage = (page) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('currentPage', page.toString());
    }
  };

  const fetchProducts = async (page = 1, query = '') => {
    try {
      if (!authService.checkTokenValidity()) {
        console.error('Token is invalid or missing');
        authService.logout();
        window.location.href = '/';
        return;
      }

      console.log('Fetching products for page:', page);
      setIsPageLoading(true);
      const response = await productService.getProducts({
        page,
        limit: 12,
      });

      console.log('API response:', response);

      if (response && response.success && response.data) {
        // Map products and handle null details
        const productsData = response.data.products.map(product => {
          if (product.details === null) {
            // Create a default product object for items with null details
            return {
              productId: product.productId,
              quantity: product.quantity,
              threshold: product.threshold,
              availability: product.availability,
              name: `Product ${product.productId.slice(-4)}`,
              description: 'Product details not available',
              unit: 'N/A',
              category: 'Uncategorized',
              origin: 'Unknown',
              shelfLife: 'N/A',
              image: '/placeholder-image.png',
              price: 0,
              actualPrice: 0
            };
          }
          return {
            productId: product.productId,
            quantity: product.quantity,
            threshold: product.threshold,
            availability: product.availability,
            ...product.details
          };
        });

        console.log('Processed products:', {
          total: productsData.length,
          page: page,
          expectedPerPage: 12,
          withDetails: productsData.filter(p => p.description !== 'Product details not available').length,
          withoutDetails: productsData.filter(p => p.description === 'Product details not available').length
        });

        // Update pagination state
        const paginationData = {
          ...response.data.pagination,
          currentPage: parseInt(page),
          limit: 12,
          totalProducts: response.data.pagination.totalProducts,
          totalPages: Math.ceil(response.data.pagination.totalProducts / 12)
        };

        setProducts(productsData);
        setPagination(paginationData);
        setCurrentPage(page);
      } else {
        throw new Error(response?.message || 'Failed to fetch products: Invalid API response structure');
      }
    } catch (error) {
      console.error('Fetch Products Error:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      setError(error.response?.data?.message || error.message || 'Failed to fetch products');
    } finally {
      setIsLoading(false);
      setIsPageLoading(false);
    }
  };

  const handleUpdateProduct = async () => {
    try {
      setUpdateError(null);
      setUpdateSuccess(null);

      if (!authService.checkTokenValidity()) {
        console.error('Token is invalid or missing');
        authService.logout();
        window.location.href = '/';
        return;
      }

      const storeId = authService.getStoreId();
      if (!storeId) {
        throw new Error('Store ID is missing');
      }

      // Build update payload with only provided fields
      const payload = { storeId, productId: selectedProduct.productId };
      if (updateForm.quantity !== '') payload.quantity = parseInt(updateForm.quantity);
      if (updateForm.threshold !== '') payload.threshold = parseInt(updateForm.threshold);
      if (updateForm.availability !== undefined) payload.availability = updateForm.availability;

      console.log('Submitting update with payload:', payload);
      const response = await productService.updateProduct(payload);

      setUpdateSuccess('Product updated successfully');
      
      // Refresh products after update
      await fetchProducts(pagination.currentPage);

      // Reset form
      setUpdateForm({ quantity: '', availability: true, threshold: '' });
    } catch (error) {
      console.error('Update Product Error:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      setUpdateError(error.response?.data?.message || error.message || 'Failed to update product');
    }
  };

  useEffect(() => {
    console.log('StoreProducts component mounted');
    const savedPage = getCurrentPage();
    fetchProducts(savedPage);
  }, []);

  const handleSearch = () => {
    setCurrentPage(1); // Reset to page 1 when searching
    fetchProducts(1);
  };

  const clearSearch = () => {
    setSearchTerm('');
    setCurrentPage(1); // Reset to page 1 when clearing search
    fetchProducts(1);
  };

  const handleNextPage = () => {
    if (pagination.currentPage < pagination.totalPages && pagination.hasNextPage) {
      const nextPage = pagination.currentPage + 1;
      fetchProducts(nextPage);
    }
  };

  const handlePrevPage = () => {
    if (pagination.currentPage > 1 && pagination.hasPrevPage) {
      const prevPage = pagination.currentPage - 1;
      fetchProducts(prevPage);
    }
  };

  const handleFilterSubmit = () => {
    setIsFilterOpen(false);
    setCurrentPage(1); // Reset to page 1 when applying filters
    fetchProducts(1);
  };

  const openProductDetails = (product) => {
    setSelectedProduct(product);
    setIsDetailsOpen(true);
  };

  const openUpdateDialog = (product) => {
    setSelectedProduct(product);
    setUpdateForm({
      quantity: product.quantity.toString(),
      availability: product.availability,
      threshold: product.threshold.toString(),
    });
    setIsUpdateOpen(true);
  };

  // Client-side filtering and sorting
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filters.category === 'all' || product.category.toLowerCase() === filters.category.toLowerCase();
    const matchesAvailability = filters.availability === 'both' ||
      (filters.availability === 'available' && product.availability) ||
      (filters.availability === 'not' && !product.availability);
    return matchesSearch && matchesCategory && matchesAvailability;
  }).sort((a, b) => {
    const order = filters.orderBy === 'asc' ? 1 : -1;
    if (filters.sortBy === 'price') {
      return (a.price - b.price) * order;
    } else if (filters.sortBy === 'stock') {
      return (a.quantity - b.quantity) * order;
    } else if (filters.sortBy === 'threshold') {
      return (a.threshold - b.threshold) * order;
    }
    return 0;
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6 text-green-600 text-center">Store Inventory</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <ProductCardSkeleton />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen p-6">
        <div className="text-center bg-red-50 p-8 rounded-lg border border-red-200">
          <h2 className="text-2xl font-bold text-red-700 mb-2">Error Loading Products</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <Button 
            onClick={() => { setError(null); fetchProducts(); }}
            variant="destructive"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 mt-[-18px]">
      <h1 className="text-2xl font-bold mb-6 text-center text-green-600">Store Inventory</h1>
      
      <div className="mb-6 flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsFilterOpen(true)}
          className="bg-white hover:bg-gray-100"
        >
          <FilterIcon className="h-4 w-4 text-gray-600" />
        </Button>
        
        <div className="relative flex-1 min-w-0">
          <Input 
            type="text" 
            placeholder="Search product"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => { if (e.key === 'Enter') handleSearch(); }}
            className="w-full pl-10 pr-10 py-2 border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-full bg-white shadow-sm"
          />
          <SearchIcon 
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={20}
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-0 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              onClick={clearSearch}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
          {!searchTerm && (
            <Button 
              variant="ghost"
              className="absolute right-0 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full"
              onClick={handleSearch}
            >
              Search
            </Button>
          )}
        </div>
      </div>

      <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
        <DialogContent className="sm:max-w-md bg-white rounded-lg shadow-lg border border-gray-100">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-xl font-semibold text-gray-800">Filter Products</DialogTitle>
            <DialogDescription className="text-sm text-gray-500">Adjust filters to refine your search</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Sort By</label>
              <Select value={filters.sortBy} onValueChange={(value) => setFilters(prev => ({ ...prev, sortBy: value }))}>
                <SelectTrigger className="w-full border-gray-200 focus:ring-2 focus:ring-blue-400 bg-white shadow-sm">
                  <SelectValue placeholder="Select sort option" />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-200">
                  <SelectItem value="price">Price</SelectItem>
                  <SelectItem value="stock">Stock</SelectItem>
                  <SelectItem value="threshold">Threshold</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Order By</label>
              <Select value={filters.orderBy} onValueChange={(value) => setFilters(prev => ({ ...prev, orderBy: value }))}>
                <SelectTrigger className="w-full border-gray-200 focus:ring-2 focus:ring-blue-400 bg-white shadow-sm">
                  <SelectValue placeholder="Select order" />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-200">
                  <SelectItem value="asc">Ascending</SelectItem>
                  <SelectItem value="desc">Descending</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Category</label>
              <Select value={filters.category} onValueChange={(value) => setFilters(prev => ({ ...prev, category: value }))}>
                <SelectTrigger className="w-full border-gray-200 focus:ring-2 focus:ring-blue-400 bg-white shadow-sm">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-200">
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="Vegetable">Vegetable</SelectItem>
                  <SelectItem value="Fruit">Fruit</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Availability</label>
              <Select value={filters.availability} onValueChange={(value) => setFilters(prev => ({ ...prev, availability: value }))}>
                <SelectTrigger className="w-full border-gray-200 focus:ring-2 focus:ring-blue-400 bg-white shadow-sm">
                  <SelectValue placeholder="Select availability" />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-200">
                  <SelectItem value="both">Both</SelectItem>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="not">Not Available</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="pt-4 flex justify-end gap-2">
            <Button onClick={handleFilterSubmit} className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded-md transition-colors shadow-sm">
              Apply Filters
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white font-medium px-6 py-2 rounded-md transition-colors shadow-sm"
              onClick={() => {
                fetchProducts();
                setFilters({ sortBy: 'price', orderBy: 'asc', category: 'all', availability: 'both' });
                setIsFilterOpen(false);
              }}
            >
              Clear Filters
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Products Grid with Loading Overlay */}
      <div className="relative min-h-[400px]">
        {isPageLoading && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <Loader2 className="h-10 w-10 animate-spin text-green-600" />
                <div className="absolute inset-0 bg-white/50 rounded-full blur-sm"></div>
              </div>
              <p className="text-sm font-medium text-gray-700">Loading products...</p>
            </div>
          </div>
        )}
        
        {filteredProducts.length === 0 ? (
          <div className="text-center text-gray-500 py-10">No products available</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map((product) => {
              // Safely handle null details
              const productName = product.name || `Product ${product.productId?.slice(-4) || 'Unknown'}`;
              const productCategory = product.category || 'Uncategorized';
              const productOrigin = product.origin || 'Unknown';
              const productImage = product.image || 'https://placehold.co/400x300/e2e8f0/94a3b8?text=No+Image';
              const productPrice = product.price ?? 0;
              const productQuantity = product.quantity ?? 0;
              const productThreshold = product.threshold ?? 0;
              const productAvailability = product.availability ?? false;

              return (
                <Card
                  key={product.productId}
                  className={`
                    h-[360px] flex flex-col
                    bg-white rounded-lg shadow-md hover:shadow-xl
                    transition-all duration-200 ease-in-out
                    cursor-pointer overflow-hidden
                    border ${ /* Conditional Border Styling */
                      productQuantity === 0
                        ? 'border-red-300 bg-red-50/50'
                        : productQuantity < productThreshold
                        ? 'border-yellow-300 bg-yellow-50/50'
                        : 'border-gray-200'
                    }
                  `}
                  onClick={() => openProductDetails(product)}
                  role="button"
                  tabIndex={0}
                  onKeyPress={(e) => { if (e.key === 'Enter' || e.key === ' ') openProductDetails(product); }}
                >
                  {/* Card Header */}
                  <CardHeader className="p-3 relative border-b border-gray-100">
                    <CardTitle className="text-sm font-semibold text-gray-800 truncate pr-8" title={productName}>
                      {productName}
                    </CardTitle>
                    <CardDescription className="text-xs text-gray-500 truncate" title={`${productCategory} from ${productOrigin}`}>
                      {productCategory} from {productOrigin}
                    </CardDescription>
                    {/* Update Button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        openUpdateDialog(product);
                      }}
                      className="absolute top-2 right-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-full h-7 w-7 z-10"
                      aria-label={`Update ${productName}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </CardHeader>

                  {/* Card Content */}
                  <CardContent className="flex-grow flex flex-col p-3 pt-2">
                    {/* Image */}
                    <div className="relative w-full h-40 mb-2 flex-shrink-0">
                      <Image
                        src={productImage}
                        alt={productName}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                        className="object-cover rounded-md"
                        unoptimized={true}
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.src = 'https://placehold.co/400x300/e2e8f0/94a3b8?text=Error';
                          e.currentTarget.onerror = null; // Prevent infinite loop
                        }}
                      />
                      {/* Availability Badge on Image */}
                      <span className={`absolute top-1 left-1 px-1.5 py-0.5 rounded text-[10px] font-medium z-10 ${productAvailability ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {productAvailability ? 'Available' : 'Unavailable'}
                      </span>
                    </div>

                    {/* Text Details */}
                    <div className="text-xs text-gray-700 mt-auto space-y-1">
                      {/* Prices */}
                      <div className="flex justify-between items-center">
                        <p className="font-semibold text-green-700">Price: ₹{productPrice}</p>
                      </div>
                      {/* Stock and Threshold */}
                      <div className="flex justify-between items-center text-[11px]">
                        <p className={`px-1 py-0.5 rounded ${
                          productQuantity === 0 ? 'bg-red-100 text-red-800' :
                          productQuantity < productThreshold ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          Stock: {productQuantity}
                        </p>
                        <p className="text-gray-500">Threshold: {productThreshold}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      <div className="flex justify-between items-center mt-6">
        <Button 
          onClick={handlePrevPage} 
          disabled={!pagination.hasPrevPage || isPageLoading} 
          variant="outline" 
          className="border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed min-w-[100px]"
        >
          {isPageLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            'Previous'
          )}
        </Button>
        <span className="text-sm text-gray-600">
          Page {pagination.currentPage} of {pagination.totalPages}
        </span>
        <Button 
          onClick={handleNextPage} 
          disabled={!pagination.hasNextPage || isPageLoading} 
          variant="outline" 
          className="border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed min-w-[100px]"
        >
          {isPageLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            'Next'
          )}
        </Button>
      </div>

      {/* Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={(open) => {
        setIsDetailsOpen(open);
        if (!open) {
          setSelectedProduct(null);
        }
      }}>
        <DialogContent className="sm:max-w-2xl max-h-[70vh] overflow-y-auto bg-white rounded-lg shadow-lg border border-gray-100">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-800">
              {selectedProduct?.name} Details
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500">
              View product details
            </DialogDescription>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-4">
                <div className="relative w-24 h-24">
                  <Image
                    src={selectedProduct.image}
                    alt={selectedProduct.name}
                    fill
                    className="object-cover rounded-md"
                    unoptimized
                  />
                </div>
                <div>
                  <p><strong>Name:</strong> {selectedProduct.name}</p>
                  <p><strong>Category:</strong> {selectedProduct.category}</p>
                  <p><strong>Origin:</strong> {selectedProduct.origin}</p>
                </div>
              </div>
              <p><strong>Description:</strong> {selectedProduct.description}</p>
              <p><strong>Unit:</strong> {selectedProduct.unit}</p>
              <p><strong>Shelf Life:</strong> {selectedProduct.shelfLife}</p>
              <p><strong>Price:</strong> ₹{selectedProduct.price}</p>
              <p><strong>Actual Price:</strong> ₹{selectedProduct.actualPrice}</p>
              <p><strong>Product ID:</strong> {selectedProduct.productId}</p>
              <p><strong>Stock:</strong> {selectedProduct.quantity}</p>
              <p><strong>Threshold:</strong> {selectedProduct.threshold}</p>
              <p><strong>Availability:</strong> {selectedProduct.availability ? 'Available' : 'Not Available'}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Update Dialog */}
      <Dialog open={isUpdateOpen} onOpenChange={(open) => {
        setIsUpdateOpen(open);
        if (!open) {
          setSelectedProduct(null);
          setUpdateForm({ quantity: '', availability: true, threshold: '' });
          setUpdateError(null);
          setUpdateSuccess(null);
        }
      }}>
        <DialogContent className="sm:max-w-md bg-white rounded-lg shadow-lg border border-gray-100">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-800">
              Update {selectedProduct?.name}
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500">
              Update product details
            </DialogDescription>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-4 py-4">
              {updateError && (
                <p className="text-red-600 text-sm">{updateError}</p>
              )}
              {updateSuccess && (
                <p className="text-green-600 text-sm">{updateSuccess}</p>
              )}
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={updateForm.quantity}
                  onChange={(e) => setUpdateForm(prev => ({ ...prev, quantity: e.target.value }))}
                  placeholder="Enter quantity"
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="threshold">Threshold</Label>
                <Input
                  id="threshold"
                  type="number"
                  value={updateForm.threshold}
                  onChange={(e) => setUpdateForm(prev => ({ ...prev, threshold: e.target.value }))}
                  placeholder="Enter threshold"
                  className="w-full"
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="availability"
                  checked={updateForm.availability}
                  onCheckedChange={(checked) => setUpdateForm(prev => ({ ...prev, availability: checked }))}
                />
                <Label htmlFor="availability">Available</Label>
              </div>
              <Button
                onClick={handleUpdateProduct}
                className="bg-green-600 hover:bg-green-700 text-white font-medium px-6 py-2 rounded-md transition-colors shadow-sm"
              >
                Update Product
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}