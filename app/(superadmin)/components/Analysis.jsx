'use client';
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Package, Users } from "lucide-react";
import { format } from "date-fns";
import { analysisService } from '@/services/superservice';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, Label } from 'recharts';
import { toast } from "sonner";

export const Analysis = () => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysisData, setAnalysisData] = useState(null);

  const formatDateForAPI = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return format(date, 'yyyy/MM/dd');
  };

  const fetchAnalysis = async () => {
    if (!startDate || !endDate) {
      toast.error('Please select both start and end dates');
      return;
    }

    const formattedStartDate = formatDateForAPI(startDate);
    const formattedEndDate = formatDateForAPI(endDate);

    if (!formattedStartDate || !formattedEndDate) {
      toast.error('Invalid date format');
      return;
    }

    setLoading(true);
    try {
      const response = await analysisService.getAnalysis({
        startDate: formattedStartDate,
        endDate: formattedEndDate
      });
      setAnalysisData(response.data);
    } catch (error) {
      toast.error(error.message || 'Failed to fetch analysis data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Store Analysis</h2>
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <Button
            onClick={fetchAnalysis}
            disabled={loading}
            className="mt-6 bg-green-600 hover:bg-green-700 text-white"
          >
            {loading ? 'Loading...' : 'Analyze'}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : analysisData ? (
        <div className="grid gap-6">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analysisData.overallAnalysis.totalOrders}</div>
                <p className="text-xs text-muted-foreground">Total orders in the period</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Order Value</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(analysisData.overallAnalysis.averageOrderValue)}</div>
                <p className="text-xs text-muted-foreground">Average revenue per order</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analysisData.userAnalysis.totalUsers}</div>
                <p className="text-xs text-muted-foreground">Total registered users</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analysisData.userAnalysis.activeUsers}</div>
                <p className="text-xs text-muted-foreground">Users who placed orders</p>
              </CardContent>
            </Card>
          </div>

          {/* Top Order Details */}
          <Card>
            <CardHeader>
              <CardTitle>Top Order Details</CardTitle>
            </CardHeader>
            <CardContent>
              {analysisData.overallAnalysis.topOrder ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Order ID: {analysisData.overallAnalysis.topOrder.orderId}</h4>
                      <p className="text-sm text-muted-foreground">
                        Customer: {analysisData.overallAnalysis.topOrder.userId.name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Order Date</p>
                      <p className="font-medium">{formatDate(analysisData.overallAnalysis.topOrder.orderDate)}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-muted-foreground">Total Amount</p>
                      <p className="font-medium">{formatCurrency(analysisData.overallAnalysis.topOrder.totalAmount)}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-muted-foreground">Shipping Amount</p>
                      <p className="font-medium">{formatCurrency(analysisData.overallAnalysis.topOrder.shippingAmount)}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No orders found in the selected date range</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Store Performance Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Store Performance</CardTitle>
            </CardHeader>
            <CardContent>
              {analysisData.storeAnalysis.stores.length > 0 ? (
                <>
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={analysisData.storeAnalysis.stores}
                        margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="storeName" 
                          tick={{ fontSize: 12 }}
                          height={60}
                          interval={0}
                          tickMargin={10}
                        />
                        <YAxis yAxisId="left" orientation="left" stroke="#22c55e">
                          <Label value="Number of Orders" angle={-90} position="insideLeft" style={{ textAnchor: 'middle' }} />
                        </YAxis>
                        <YAxis yAxisId="right" orientation="right" stroke="#84cc16">
                          <Label value="Average Order Value (₹)" angle={90} position="insideRight" style={{ textAnchor: 'middle' }} />
                        </YAxis>
                        <Tooltip 
                          content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="bg-white p-4 border rounded-lg shadow-lg">
                                  <p className="font-semibold mb-2">{label}</p>
                                  <div className="space-y-1">
                                    <p className="text-sm">
                                      <span className="text-green-600">●</span> Total Orders: {payload[0].value}
                                    </p>
                                    <p className="text-sm">
                                      <span className="text-lime-600">●</span> Average Order Value: {formatCurrency(payload[1].value)}
                                    </p>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Legend 
                          verticalAlign="top" 
                          height={36}
                          formatter={(value) => (
                            <span className="text-sm font-medium">{value}</span>
                          )}
                        />
                        <Bar 
                          yAxisId="left"
                          dataKey="totalOrders" 
                          fill="#22c55e" 
                          name="Total Orders"
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar 
                          yAxisId="right"
                          dataKey="avgOrderValue" 
                          fill="#84cc16" 
                          name="Average Order Value"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 text-sm text-muted-foreground">
                    <p className="mb-2">This chart shows two key metrics for each store:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li><span className="text-green-600">●</span> Total Orders: The number of orders received by each store</li>
                      <li><span className="text-lime-600">●</span> Average Order Value: The average amount spent per order at each store</li>
                    </ul>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No store data available for the selected date range</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Performing Store */}
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Store</CardTitle>
            </CardHeader>
            <CardContent>
              {analysisData.storeAnalysis.stores.map((store) => (
                <div key={store._id} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{store.storeName}</h4>
                      <p className="text-sm text-muted-foreground">Store ID: {store.storeId}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Total Orders</p>
                      <p className="font-medium">{store.totalOrders}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-muted-foreground">Average Order Value</p>
                      <p className="font-medium">{formatCurrency(store.avgOrderValue)}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-muted-foreground">Top Order</p>
                      <p className="font-medium">{formatCurrency(store.topOrder.totalAmount)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="text-center text-muted-foreground">Select date range to view analysis</div>
      )}
    </div>
  );
};
