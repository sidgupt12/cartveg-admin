'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DateInput } from "@/components/ui/date-input";
import { Button } from "@/components/ui/button";
import { CalendarIcon, TrendingUp, TrendingDown, DollarSign, ShoppingCart, Package, Upload } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { reportService } from '@/services/storeservice';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import Cookies from 'js-cookie';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export default function Report() {
  const [date, setDate] = useState(new Date());
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadDate, setUploadDate] = useState(new Date());

  const formatDateForAPI = (date) => {
    return format(date, 'yyyy-MM-dd');
  };

  const fetchReport = async (selectedDate) => {
    try {
      setLoading(true);
      setError(null);
      const storeId = Cookies.get('storeId');
      const userRole = Cookies.get('userRole');
      const userData = Cookies.get('userData');
      
      console.log('Debug - Cookies:', {
        storeId,
        userRole,
        userData: userData ? JSON.parse(userData) : null
      });
      
      if (!storeId) {
        throw new Error('Store ID not found. Please ensure you are logged in.');
      }

      const formattedDate = formatDateForAPI(selectedDate);
      console.log('Fetching report for date:', formattedDate);
      const response = await reportService.getDailyReport(storeId, formattedDate);
      setReport(response.report);
    } catch (error) {
      console.error('Error fetching report:', error);
      setError(error.response?.data?.error || error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport(date);
  }, [date]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'text/csv') {
      setSelectedFile(file);
    } else {
      toast.error('Please select a valid CSV file');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a file first');
      return;
    }

    try {
      setUploadLoading(true);
      const storeId = Cookies.get('storeId');
      
      if (!storeId) {
        throw new Error('Store ID not found. Please ensure you are logged in.');
      }

      const formData = new FormData();
      formData.append('file', selectedFile);

      await reportService.uploadPurchaseReport(formData, storeId, formatDateForAPI(uploadDate));
      toast.success('Report uploaded successfully');
      
      // Refresh the current report
      fetchReport(date);
      
      // Reset form
      setSelectedFile(null);
      setUploadDate(new Date());
    } catch (error) {
      console.error('Error uploading report:', error);
      toast.error(error.response?.data?.error || 'Failed to upload report');
    } finally {
      setUploadLoading(false);
    }
  };

  const costData = [
    { name: 'Purchase Cost', value: report?.total_purchase_cost || 0 },
    { name: 'Fixed Cost', value: report?.total_fixed_cost || 0 },
    { name: 'Labour Cost', value: report?.labour_cost || 0 },
    { name: 'Packaging Cost', value: report?.packaging_cost || 0 },
  ];

  const profitData = [
    { name: 'Sales', value: report?.total_sale_amount || 0 },
    { name: 'Costs', value: (report?.total_purchase_cost + report?.total_fixed_cost + report?.labour_cost + report?.packaging_cost) || 0 },
  ];

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border rounded shadow-sm">
          <p className="font-medium">{payload[0].name}</p>
          <p className="text-sm">₹{payload[0].value}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Daily Report</h2>
        <div className="flex items-center gap-4">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Upload className="h-4 w-4" />
                Upload Report
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Upload Daily Report</DialogTitle>
                <DialogDescription>
                  Upload your daily purchase report in CSV format.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="date">Report Date</Label>
                  <DateInput
                    value={uploadDate}
                    onChange={setUploadDate}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="file">CSV File</Label>
                  <Input
                    id="file"
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="cursor-pointer"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button 
                  onClick={handleUpload} 
                  disabled={!selectedFile || uploadLoading}
                  className="gap-2 bg-green-600 hover:bg-green-700 text-white"
                >
                  {uploadLoading ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      Upload
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <DateInput
            value={date}
            onChange={setDate}
            className="w-[240px]"
          />
        </div>
      </div>

      {error && (
        <div className="bg-destructive/15 text-destructive p-4 rounded-md">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : report ? (
        <div className="grid gap-6">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹{report.total_sale_amount}</div>
                <p className="text-xs text-muted-foreground">Total revenue for the day</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{report.total_orders}</div>
                <p className="text-xs text-muted-foreground">Orders placed today</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Order Value</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹{report.avg_order_value}</div>
                <p className="text-xs text-muted-foreground">Per order average</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Net Profit/Loss</CardTitle>
                {report.status === 'Profit' ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${report.status === 'Profit' ? 'text-green-500' : 'text-red-500'}`}>
                  ₹{report.net_profit_or_loss}
                </div>
                <p className="text-xs text-muted-foreground">{report.status}</p>
              </CardContent>
            </Card>
          </div>

          {/* Additional Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cash on Delivery</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹{report.cash_on_delivery_amount}</div>
                <p className="text-xs text-muted-foreground">COD payments</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Online Payments</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹{report.online_payment_amount}</div>
                <p className="text-xs text-muted-foreground">Digital payments</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Most Selling Product</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{report.most_selling_quantity}</div>
                <p className="text-xs text-muted-foreground">
                  {report.most_selling_product_id ? `Product ID: ${report.most_selling_product_id}` : 'No data'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Costs</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ₹{report.total_purchase_cost + report.total_fixed_cost + report.labour_cost + report.packaging_cost}
                </div>
                <p className="text-xs text-muted-foreground">All costs combined</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Cost Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={costData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        paddingAngle={5}
                      >
                        {costData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend
                        layout="vertical"
                        align="right"
                        verticalAlign="middle"
                        formatter={(value, entry) => (
                          <span className="text-sm">
                            {value} - ₹{entry.payload.value}
                          </span>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment Methods</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Cash on Delivery', value: report.cash_on_delivery_amount },
                          { name: 'Online Payment', value: report.online_payment_amount }
                        ]}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        paddingAngle={5}
                      >
                        {[
                          { name: 'Cash on Delivery', value: report.cash_on_delivery_amount },
                          { name: 'Online Payment', value: report.online_payment_amount }
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend
                        layout="vertical"
                        align="right"
                        verticalAlign="middle"
                        formatter={(value, entry) => (
                          <span className="text-sm">
                            {value} - ₹{entry.payload.value}
                          </span>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Sales vs Costs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={profitData}>
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Bar dataKey="value" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <div className="text-center text-muted-foreground">No report data available for the selected date.</div>
      )}
    </div>
  );
}
