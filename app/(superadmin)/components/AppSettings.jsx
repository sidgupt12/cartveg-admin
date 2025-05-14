'use client';

import React, { useState, useEffect } from 'react';
import { appService } from '@/services/superservice';
import { imageService } from '@/services/GlobalService';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/sonner";
import { Loader2, Upload, X, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';

const AppSettings = () => {
  const [appDetails, setAppDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [formData, setFormData] = useState({
    bannerImages: [],
    privacyPolicy: '',
    termsAndConditions: '',
    aboutUs: '',
    contactno: '',
    email: '',
    deliveryTime: '',
    address: '',
    refAmount: 0,
  });

  // Fetch app details on component mount
  useEffect(() => {
    fetchAppDetails();
  }, []);

  const fetchAppDetails = async () => {
    try {
      setLoading(true);
      const response = await appService.getAppDetails();
      setAppDetails(response.data);
      setFormData({
        bannerImages: response.data.bannerImages || [],
        privacyPolicy: response.data.privacyPolicy || '',
        termsAndConditions: response.data.termsAndConditions || '',
        aboutUs: response.data.aboutUs || '',
        contactno: response.data.contactno || '',
        email: response.data.email || '',
        deliveryTime: response.data.deliveryTime || '',
        address: response.data.address || '',
        refAmount: response.data.refAmount || 0,
      });
    } catch (error) {
      toast.error('Failed to fetch app details', {
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    try {
      setUploadingImages(true);
      const uploadPromises = files.map(file => imageService.uploadImage(file));
      const uploadedImages = await Promise.all(uploadPromises);
      
      setFormData(prev => ({
        ...prev,
        bannerImages: [...prev.bannerImages, ...uploadedImages.map(img => img.url)]
      }));

      toast.success('Images uploaded successfully');
    } catch (error) {
      toast.error('Failed to upload images', {
        description: error.message,
      });
    } finally {
      setUploadingImages(false);
    }
  };

  const removeImage = (index) => {
    setFormData(prev => ({
      ...prev,
      bannerImages: prev.bannerImages.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      
      // Ensure all fields are present with existing values
      const payload = {
        appName: "cartVeg", // Fixed app name
        bannerImages: formData.bannerImages || [],
        privacyPolicy: formData.privacyPolicy || '',
        termsAndConditions: formData.termsAndConditions || '',
        aboutUs: formData.aboutUs || '',
        contactno: formData.contactno || '',
        email: formData.email || '',
        deliveryTime: formData.deliveryTime || '',
        address: formData.address || '',
        refAmount: formData.refAmount || 0,
      };

      console.log('First API call - About Us:', payload.aboutUs);
      await appService.updateAppDetails(payload);
      
      console.log('Second API call - About Us:', payload.aboutUs);
      await appService.updateAppDetails(payload);
      
      toast.success('App settings updated successfully');
      fetchAppDetails(); // Refresh data
    } catch (error) {
      // Only show error toast if it's not the specific error we want to ignore
      if (!error.message?.includes('Cannot read properties of undefined')) {
        toast.error('Failed to update app settings', {
          description: error.message,
        });
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">App Settings</h1>
      
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Banner Images Section */}
        <Card>
          <CardHeader>
            <CardTitle>Banner Images</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {formData.bannerImages.map((image, index) => (
                  <div key={index} className="relative group">
                    <div className="aspect-video relative rounded-lg overflow-hidden border">
                      <Image
                        src={image}
                        alt={`Banner ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg cursor-pointer hover:bg-green-700 transition-colors">
                  <Upload className="h-4 w-4" />
                  {uploadingImages ? 'Uploading...' : 'Upload Images'}
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={uploadingImages}
                  />
                </label>
                {uploadingImages && (
                  <Loader2 className="h-4 w-4 animate-spin text-green-600" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Contact Number</label>
                <Input
                  name="contactno"
                  value={formData.contactno}
                  onChange={handleInputChange}
                  placeholder="Enter contact number"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter email address"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Delivery Time</label>
                <Input
                  name="deliveryTime"
                  value={formData.deliveryTime}
                  onChange={handleInputChange}
                  placeholder="Enter delivery time information"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Address</label>
                <Input
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Enter address"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Referral Amount (₹)</label>
                <Input
                  name="refAmount"
                  type="number"
                  value={formData.refAmount}
                  onChange={handleInputChange}
                  placeholder="Enter referral amount"
                  min="0"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Legal Information */}
        <Card>
          <CardHeader>
            <CardTitle>Legal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Privacy Policy URL</label>
              <Input
                name="privacyPolicy"
                value={formData.privacyPolicy}
                onChange={handleInputChange}
                placeholder="Enter privacy policy URL"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Terms & Conditions URL</label>
              <Input
                name="termsAndConditions"
                value={formData.termsAndConditions}
                onChange={handleInputChange}
                placeholder="Enter terms and conditions URL"
              />
            </div>
          </CardContent>
        </Card>

        {/* About Us */}
        <Card>
          <CardHeader>
            <CardTitle>About Us</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Textarea
                name="aboutUs"
                value={formData.aboutUs}
                onChange={handleInputChange}
                placeholder="Enter about us text"
                className="min-h-[150px]"
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button
            type="submit"
            className="bg-green-600 hover:bg-green-700"
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AppSettings; 