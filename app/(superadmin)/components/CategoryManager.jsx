// app/components/CategoryManager.jsx
'use client';
import { categoryService } from '@/services/GlobalService';
import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardFooter,
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
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Trash2, Edit, Plus } from 'lucide-react';

const CategoryManager = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await categoryService.getCategories();
      if (response.success) {
        setCategories(response.categories);
        setError(null);
      } else {
        setError(response.message || 'Failed to fetch categories');
      }
    } catch (err) {
      setError('Error fetching categories: ' + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Category Form Component (for Create and Update)
  const CategoryForm = ({ onSubmit, initialData = {}, isUpdate = false }) => {
    const [formData, setFormData] = useState({
      name: initialData.name || '',
      image: initialData.image || '',
    });
    const [formError, setFormError] = useState(null);
    const [formLoading, setFormLoading] = useState(false);

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
          name: formData.name,
          image: formData.image,
        };
        if (isUpdate) {
          data.id = initialData._id;
          await categoryService.updateCategory(data);
        } else {
          await categoryService.createCategory(data);
        }
        await fetchCategories();
        onSubmit();
      } catch (err) {
        setFormError('Error saving category: ' + err.message);
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
          <Label htmlFor="name" className="text-sm font-medium text-gray-700">
            Category Name
          </Label>
          <Input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            placeholder="Enter category name"
            className="rounded-md border-gray-300 focus:border-green-500 focus:ring-green-500"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="image" className="text-sm font-medium text-gray-700">
            Image URL
          </Label>
          <Input
            type="url"
            id="image"
            name="image"
            value={formData.image}
            onChange={handleChange}
            required
            placeholder="Enter image URL"
            className="rounded-md border-gray-300 focus:border-green-500 focus:ring-green-500"
          />
          {formData.image && (
            <div className="mt-2">
              <img
                src={formData.image}
                alt="Preview"
                className="h-16 w-16 object-cover rounded-md"
                onError={(e) => (e.target.src = '/placeholder.png')}
              />
            </div>
          )}
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
            {formLoading ? 'Saving...' : isUpdate ? 'Update Category' : 'Create Category'}
          </Button>
        </DialogFooter>
      </form>
    );
  };

  // Category List Component
  const CategoryList = () => {
    const handleEditCategory = (category) => {
      setSelectedCategory(category);
      setIsUpdateModalOpen(true);
    };

    const handleDeleteCategory = async (categoryId) => {
      if (!confirm('Are you sure you want to delete this category?')) return;
      setError(null);
      try {
        await categoryService.deleteCategory(categoryId);
        await fetchCategories();
      } catch (err) {
        setError('Error deleting category: ' + err.message);
        console.error(err);
      }
    };

    return (
      <div className="mt-4">
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-48 w-full rounded-lg" />
            ))}
          </div>
        )}
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
        {!loading && categories.length === 0 && !error && (
          <p className="text-center text-gray-500 py-4">
            No categories found. Create one to get started!
          </p>
        )}
        {categories.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {categories.map((category) => (
              <Card
                key={category._id}
                className="overflow-hidden transition-transform hover:scale-105 hover:shadow-md"
              >
                <CardHeader className="bg-gray-50 p-3">
                  <CardTitle className="text-base font-semibold text-gray-800 truncate">
                    {category.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3">
                  <img
                    src={category.image}
                    alt={category.name}
                    className="h-24 w-full object-cover rounded-md"
                    onError={(e) => (e.target.src = '/placeholder.png')}
                  />
                </CardContent>
                <CardFooter className="flex justify-end space-x-2 p-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditCategory(category)}
                    className="text-green-600 border-green-600 hover:bg-green-50 text-xs"
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteCategory(category._id)}
                    className="text-red-600 border-red-600 hover:bg-red-50 text-xs"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Delete
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Main Component Render
  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 bg-gray-50 min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Category Management</h1>
        <Button
          onClick={() => {
            setSelectedCategory(null);
            setError(null);
            setIsCreateModalOpen(true);
          }}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Category
        </Button>
      </div>

      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-md rounded-lg border border-gray-200 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-green-600">
              Create New Category
            </DialogTitle>
          </DialogHeader>
          <CategoryForm onSubmit={() => setIsCreateModalOpen(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={isUpdateModalOpen} onOpenChange={setIsUpdateModalOpen}>
        <DialogContent className="sm:max-w-md rounded-lg border border-gray-200 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-green-600">
              Update Category
            </DialogTitle>
          </DialogHeader>
          {selectedCategory && (
            <CategoryForm
              onSubmit={() => {
                setIsUpdateModalOpen(false);
                setSelectedCategory(null);
              }}
              initialData={selectedCategory}
              isUpdate={true}
            />
          )}
        </DialogContent>
      </Dialog>

      <CategoryList />
    </div>
  );
};

export default CategoryManager;