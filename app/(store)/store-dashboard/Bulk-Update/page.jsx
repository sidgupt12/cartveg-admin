'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { productService } from '@/services/storeservice';
import { authService } from '@/services/authService';

export default function BulkUpdatePage() {
  const [file, setFile] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleDownload = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_CSV_DOWNLOAD_URL;
      if (!apiUrl) {
        throw new Error('Download URL is not configured');
      }

      const storeId = authService.getStoreId();
      if (!storeId) {
        throw new Error('Store ID is missing. Please log in again.');
      }

      const downloadUrl = `${apiUrl}?storeId=${storeId}`;
      console.log('Downloading CSV from:', downloadUrl);

      window.location.href = downloadUrl;
    } catch (err) {
      console.error('Download error:', err);
      setError(
        err.message.includes('Store ID')
          ? 'Store ID is missing. Please log in again.'
          : err.message.includes('Download URL')
          ? 'Configuration error: Download URL is missing.'
          : err.message || 'Failed to download CSV. Please try again.'
      );
    }
  };

  const handleFileChange = (event) => {
    const selectedFile = event.target.files?.[0];

    if (selectedFile && selectedFile.type !== 'text/csv') {
      setError('Only CSV files are allowed');
      setFile(null);
      return;
    }

    setError(null);
    setSuccess(null);
    setFile(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a CSV file to upload');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await productService.uploadCSV(formData);
      if (response.message === 'CSV uploaded successfully') { // Adjust based on actual server response
        setSuccess('File uploaded successfully');
        setFile(null);
      } else {
        setError(response.message || 'Failed to upload CSV file');
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload CSV file');
    }
  };

  return (
    <div className="lg:w-full lg:mt-[-100px] min-h-screen flex items-center justify-center p-6">
      <Card className="w-full max-w-md bg-white rounded-lg shadow-md border border-gray-200">
        <CardHeader className="p-6">
          <CardTitle className="text-2xl font-bold text-center text-green-600">
            Bulk Update
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          {error && <p className="text-sm text-red-600 text-center">{error}</p>}
          {success && <p className="text-sm text-green-600 text-center">{success}</p>}

          <div className="space-y-4">
            <Button
              onClick={handleDownload}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 rounded-md transition-colors shadow-sm"
            >
              Download CSV File
            </Button>

            <div>
              <label htmlFor="file-upload" className="text-sm font-medium text-gray-700">
                Upload CSV File
              </label>
              <Input
                id="file-upload"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="pl-2 w-full mt-1 border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white shadow-sm text-green-500"
              />
            </div>

            <Button
              onClick={handleUpload}
              disabled={!file}
              className={`w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 rounded-md transition-colors shadow-sm ${
                !file ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              Upload CSV
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}