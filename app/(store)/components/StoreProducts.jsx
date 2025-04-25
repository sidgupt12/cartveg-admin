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
import { SearchIcon, FilterIcon, X, Pencil } from "lucide-react";
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

export default function StoreProducts() {
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
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [updateForm, setUpdateForm] = useState({
    quantity: '',
    availability: true,
    threshold: '',
  });
  const [updateError, setUpdateError] = useState(null);
  const [updateSuccess, setUpdateSuccess] = useState(null);

  const fetchProducts = async (page = 1, query = '') => {
    try {
      if (!authService.checkTokenValidity()) {
        console.error('Token is invalid or missing');
        authService.logout();
        window.location.href = '/';
        return;
      }

      console.log('Fetching products for page:', page);
      setIsLoading(true);
      const response = await productService.getProducts({
        page,
        limit: 10,
      });

      console.log('API response:', response);

      const productsData = response.data.products.map(product => ({
        productId: product.productId,
        quantity: product.quantity,
        threshold: product.threshold,
        availability: product.availability,
        ...product.details,
      }));

      const paginationData = response.data.pagination;

      setProducts(productsData);
      setPagination(paginationData);
      setIsLoading(false);
    } catch (error) {
      console.error('Fetch Products Error:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      setError(error.response?.data?.message || error.message || 'Failed to fetch products');
      setIsLoading(false);
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
    fetchProducts();
  }, []);

  const handleSearch = () => {
    fetchProducts(1);
  };

  const clearSearch = () => {
    setSearchTerm('');
    fetchProducts(1);
  };

  const handleNextPage = () => {
    if (pagination.currentPage < pagination.totalPages) {
      fetchProducts(pagination.currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (pagination.currentPage > 1) {
      fetchProducts(pagination.currentPage - 1);
    }
  };

  const handleFilterSubmit = () => {
    setIsFilterOpen(false);
    fetchProducts(1);
  };

  const openProductDetails = (product) => {
    setSelectedProduct(product);
    setUpdateForm({
      quantity: product.quantity.toString(),
      availability: product.availability,
      threshold: product.threshold.toString(),
    });
    setIsDetailsOpen(true);
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
        <div className="grid grid-cols-5 gap-4">
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

      <Dialog open={isDetailsOpen} onOpenChange={(open) => {
        setIsDetailsOpen(open);
        if (!open) {
          setSelectedProduct(null);
          setUpdateForm({ quantity: '', availability: true, threshold: '' });
          setUpdateError(null);
          setUpdateSuccess(null);
        }
      }}>
        <DialogContent className="sm:max-w-2xl max-h-[70vh] overflow-y-auto bg-white rounded-lg shadow-lg border border-gray-100">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-800">
              {selectedProduct?.name} Details
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500">
              View and update product details
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
              
              <div className="space-y-4 pt-4">
                <h3 className="text-lg font-semibold text-gray-800">Update Product</h3>
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
            </div>
          )}
        </DialogContent>
      </Dialog>

      {filteredProducts.length === 0 ? (
        <div className="text-center text-gray-500 py-10">No products available</div>
      ) : (
        <div className="grid xl:grid-cols-5 lg:grid-cols-3 md:grid-cols-2 sm:grid-cols-1 gap-6 pr-2">
          {filteredProducts.map((product) => (
            <Card   
              key={product.productId} 
              className={`
                md:w-[250px] lg:w-[220px] xl:w-[220px] h-[360px] 
                flex flex-col 
                bg-white rounded-lg shadow-md hover:shadow-xl 
                transition-all duration-200 
                cursor-pointer 
                ${product.quantity === 0 
                  ? 'border-2 border-red-500 bg-red-50' 
                  : product.quantity < product.threshold 
                  ? 'border-2 border-yellow-400 bg-yellow-50' 
                  : 'border border-gray-200'
                }
              `}
              onClick={() => openProductDetails(product)}
            >
              <CardHeader className="p-1 mt-[-18px] ml-1 relative">
                <CardTitle className="text-sm font-semibold text-gray-800 truncate">{product.name}</CardTitle>
                <CardDescription className="text-xs text-gray-500 truncate mt-[-8px]">
                  {product.category} from {product.origin}
                </CardDescription>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    openProductDetails(product);
                  }}
                  className="absolute top-1 right-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="flex-grow flex flex-col p-2 pt-1 mt-[-8px] ml-1">
                <div className="relative w-full h-48 mt-[-10px] mb-1">
                  <Image 
                    src={product.image} 
                    alt={product.name}
                    fill
                    className="object-cover rounded-md"
                    unoptimized
                  />
                </div>
                <div className="text-xs text-gray-700 mt-2">
                  <div className="flex items-center gap-x-2">
                    <div className='m-1 ml-[-0.5px]'>
                      <p className="font-semibold text-green-600">Actual Price: ₹{product.actualPrice}</p>
                      <p className="text-gray-700 mt-1">₹{product.price}</p>
                    </div>
                    <p className={`inline-block px-1 py-0.5 rounded mt-[-20px] ${product.availability ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {product.availability ? 'Available' : 'Not Available'}
                    </p>
                  </div>
                  <p className={`inline-block px-1 py-0.5 rounded mb-1 ml-[-1px] ${product.threshold < product.quantity ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    Stock: {product.quantity}
                  </p>
                  <p className="font-medium">Threshold: {product.threshold}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="flex justify-between mt-6">
        <Button onClick={handlePrevPage} disabled={pagination.currentPage === 1} variant="outline" className="border-gray-200 text-gray-600 hover:bg-gray-100">Previous</Button>
        <span className="self-center text-gray-600">Page {pagination.currentPage} of {pagination.totalPages}</span>
        <Button onClick={handleNextPage} disabled={pagination.currentPage === pagination.totalPages} variant="outline" className="border-gray-200 text-gray-600 hover:bg-gray-100">Next</Button>
      </div>
    </div>
  );
}