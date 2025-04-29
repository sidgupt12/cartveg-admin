'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import { productService } from '@/services/storeservice';
import { authService } from '@/services/authService';

export default function BulkCsvUploader() {
  const [file, setFile] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleDownload = async () => {
    try {
      setIsLoading(true);
      
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
    } finally {
      setIsLoading(false);
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
    try {
      setIsLoading(true);
      setError(null);
      
      const storeId = authService.getStoreId();
      if (!storeId) {
        throw new Error('Store ID is required');
      }

      if (!file) {
        throw new Error('Please select a CSV file to upload');
      }

      const formData = new FormData();
      formData.append('file', file);

      const response = await productService.uploadCSV(formData, storeId);
      
      if (response && (response.success || response.message === 'CSV uploaded successfully')) {
        setSuccess('File uploaded successfully');
        setFile(null);
      } else {
        throw new Error(response?.message || 'Failed to upload CSV file');
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload CSV file');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full bg-white rounded-lg shadow-md border border-gray-200">
      <CardHeader className="p-6">
        <CardTitle className="text-2xl font-bold text-center text-green-600">
          Bulk Update
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 pt-0">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4" role="alert">
            <p>{error}</p>
          </div>
        )}
        
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4" role="alert">
            <p>{success}</p>
          </div>
        )}

        <div className="space-y-4">
          <Button
            onClick={handleDownload}
            disabled={isLoading}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 rounded-md transition-colors shadow-sm"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Downloading...
              </>
            ) : (
              'Download CSV Template'
            )}
          </Button>

          <div className="space-y-2">
            <label htmlFor="file-upload" className="text-sm font-medium text-gray-700 block">
              Upload CSV File
            </label>
            <Input
              id="file-upload"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="pl-2 w-full border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white shadow-sm text-green-500"
              disabled={isLoading}
            />
          </div>

          <Button
            onClick={handleUpload}
            disabled={!file || isLoading}
            className={`w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 rounded-md transition-colors shadow-sm ${
              (!file || isLoading) ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              'Upload CSV'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}