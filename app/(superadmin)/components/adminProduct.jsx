'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  SearchIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Loader2,
  Trash2,
} from 'lucide-react';
import { productService } from '@/services/superservice';
import { toast } from '@/components/ui/sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

// Loading Skeleton Component
const ProductCardSkeleton = () => {
  return Array(8)
    .fill(0)
    .map((_, index) => (
      <Card key={index} className="w-full h-[300px] bg-white shadow-sm border">
        <div className="animate-pulse">
          <div className="h-40 bg-gray-200 rounded-t-md"></div>
          <CardHeader className="p-3">
            <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </CardHeader>
          <CardContent className="p-3">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
          </CardContent>
        </div>
      </Card>
    ));
};

export default function ProductManagement() {
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedProductDetails, setSelectedProductDetails] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state for new product
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    category: '',
    origin: '',
    shelfLife: '',
    unit: '',
    threshold: '',
    image: '',
    actualPrice: '',
    isAvailable: true,
  });

  // Fetch products on component mount
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async (page = 1, limit = 12) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await productService.getProducts({ page, limit });

      if (response && response.data && response.data.products) {
        setProducts(response.data.products);
        setPagination({
          page: response.data.pagination?.page || page,
          limit: response.data.pagination?.limit || limit,
          totalPages: response.data.pagination?.totalPages || 1,
        });
      } else {
        throw new Error('Invalid response format from server');
      }
    } catch (error) {
      const errorMessage = error.message || 'Failed to fetch products';
      setError(errorMessage);
      toast.error('Failed to fetch products', {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateProduct = async () => {
    try {
      setIsSubmitting(true);
      const response = await productService.createProduct(newProduct);
      toast.success('Product created successfully');
      setIsCreateDialogOpen(false);
      setNewProduct({
        name: '',
        description: '',
        price: '',
        stock: '',
        category: '',
        origin: '',
        shelfLife: '',
        unit: '',
        threshold: '',
        image: '',
        actualPrice: '',
        isAvailable: true,
      });
      fetchProducts(pagination.page, pagination.limit); // Refresh the list
    } catch (error) {
      toast.error('Failed to create product', {
        description: error.message || 'An unexpected error occurred',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!selectedProduct) return;

    setIsSubmitting(true);
    try {
      const response = await productService.deleteProduct({
        id: selectedProduct._id,
      });
      toast.success('Product deleted successfully');
      setIsDeleteDialogOpen(false);
      setSelectedProduct(null);
      fetchProducts(pagination.page, pagination.limit);
    } catch (error) {
      // Log the error for debugging, but don't toast it
      console.error('Error in handleDeleteProduct:', error);
      setIsDeleteDialogOpen(false); // Close dialog on error
      setSelectedProduct(null);
      fetchProducts(pagination.page, pagination.limit); // Refresh list even on error
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewDetails = (product) => {
    setSelectedProductDetails(product);
    setIsDetailsDialogOpen(true);
  };

  const handlePageChange = (newPage) => {
    fetchProducts(newPage, pagination.limit);
  };

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <ProductCardSkeleton />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)] p-6">
        <div className="text-center bg-red-50 p-8 rounded-lg border border-red-200 shadow-md">
          <h2 className="text-2xl font-bold text-red-700 mb-2">Error Loading Products</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <Button
            onClick={() => fetchProducts(pagination.page, pagination.limit)}
            variant="destructive"
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Product Management</h1>
        <Button
          onClick={() => setIsCreateDialogOpen(true)}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add New Product
        </Button>
      </div>

      {/* Search Bar */}
      <div className="relative mb-6">
        <Input
          type="text"
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2"
        />
        <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredProducts.map((product) => (
          <Card
            key={product._id}
            className="overflow-hidden cursor-pointer"
            onClick={() => handleViewDetails(product)}
          >
            <CardHeader className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg font-semibold">{product.name}</CardTitle>
                  <CardDescription>{product.category}</CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedProduct(product);
                    setIsDeleteDialogOpen(true);
                  }}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="relative h-40 mb-4">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-cover rounded-md"
                  unoptimized={true}
                />
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">{product.description}</p>
                <div className="flex justify-between items-center">
                  <span className="font-semibold">₹{product.price}</span>
                  <span className="text-sm text-gray-500">Stock: {product.stock}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination Controls */}
      <div className="flex justify-center items-center mt-6 space-x-2">
        <Button
          disabled={pagination.page === 1}
          onClick={() => handlePageChange(pagination.page - 1)}
          variant="outline"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span>
          Page {pagination.page} of {pagination.totalPages}
        </span>
        <Button
          disabled={pagination.page === pagination.totalPages}
          onClick={() => handlePageChange(pagination.page + 1)}
          variant="outline"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Create Product Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Product</DialogTitle>
            <DialogDescription>
              Fill in the details to create a new product.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Price</Label>
                <Input
                  id="price"
                  type="number"
                  value={newProduct.price}
                  onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={newProduct.description}
                onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={newProduct.category}
                  onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stock">Stock</Label>
                <Input
                  id="stock"
                  type="number"
                  value={newProduct.stock}
                  onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="unit">Unit</Label>
                <Input
                  id="unit"
                  value={newProduct.unit}
                  onChange={(e) => setNewProduct({ ...newProduct, unit: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="threshold">Threshold</Label>
                <Input
                  id="threshold"
                  type="number"
                  value={newProduct.threshold}
                  onChange={(e) => setNewProduct({ ...newProduct, threshold: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="image">Image URL</Label>
              <Input
                id="image"
                value={newProduct.image}
                onChange={(e) => setNewProduct({ ...newProduct, image: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateProduct}
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Product'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedProduct?.name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteProduct}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Product'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Product Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{selectedProductDetails?.name}</DialogTitle>
            <DialogDescription>Product Details</DialogDescription>
          </DialogHeader>
          {selectedProductDetails && (
            <div className="grid gap-4 py-4">
              <div className="relative h-60">
                <Image
                  src={selectedProductDetails.image}
                  alt={selectedProductDetails.name}
                  fill
                  className="object-cover rounded-md"
                  unoptimized={true}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-semibold">Category</Label>
                  <p>{selectedProductDetails.category}</p>
                </div>
                <div>
                  <Label className="font-semibold">Price</Label>
                  <p>₹{selectedProductDetails.price}</p>
                </div>
                <div>
                  <Label className="font-semibold">Stock</Label>
                  <p>{selectedProductDetails.stock}</p>
                </div>
                <div>
                  <Label className="font-semibold">Unit</Label>
                  <p>{selectedProductDetails.unit}</p>
                </div>
                <div>
                  <Label className="font-semibold">Threshold</Label>
                  <p>{selectedProductDetails.threshold}</p>
                </div>
                <div>
                  <Label className="font-semibold">Origin</Label>
                  <p>{selectedProductDetails.origin}</p>
                </div>
                <div>
                  <Label className="font-semibold">Shelf Life</Label>
                  <p>{selectedProductDetails.shelfLife}</p>
                </div>
                <div>
                  <Label className="font-semibold">Availability</Label>
                  <p>{selectedProductDetails.isAvailable ? 'Available' : 'Not Available'}</p>
                </div>
              </div>
              <div>
                <Label className="font-semibold">Description</Label>
                <p>{selectedProductDetails.description}</p>
              </div>
            </div>
          )}
          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={() => setIsDetailsDialogOpen(false)}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}