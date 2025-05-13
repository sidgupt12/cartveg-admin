'use client';

import { useState, useEffect } from 'react';
import { orderService } from '@/services/superservice';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';
import { ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import React from 'react';

const statusColors = {
  placed: 'bg-blue-500',
  shipped: 'bg-yellow-500',
  delivered: 'bg-green-500',
  cancelled: 'bg-red-500',
};

const statusFlow = {
  placed: ['shipped', 'cancelled'],
  shipped: ['delivered', 'cancelled'],
  delivered: ['cancelled'],
  cancelled: [],
};

export default function OrderManagement() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortOrder, setSortOrder] = useState('desc');
  const [userId, setUserId] = useState('');
  const [updatingOrder, setUpdatingOrder] = useState(null);
  const [expandedOrder, setExpandedOrder] = useState(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await orderService.getOrders({
        page,
        limit: 10,
        sortBy: 'date',
        sortOrder,
        userId,
      });
      setOrders(response.orders);
      setTotalPages(response.totalPages);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page, sortOrder, userId]);

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      setUpdatingOrder(orderId);
      await orderService.updateOrder({ orderId, status: newStatus });
      toast.success('Order status updated successfully');
      fetchOrders();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setUpdatingOrder(null);
    }
  };

  const getAvailableStatuses = (currentStatus) => {
    return statusFlow[currentStatus] || [];
  };

  const renderUserInfo = (order) => {
    if (!order.userId) {
      return (
        <div>
          <div className="font-medium text-gray-500">Guest User</div>
          <div className="text-sm text-gray-400">No user information</div>
        </div>
      );
    }
    return (
      <div>
        <div className="font-medium">{order.userId.name}</div>
        <div className="text-sm text-gray-500">{order.userId.email}</div>
      </div>
    );
  };

  const renderProductInfo = (products) => {
    return products.map((item, index) => (
      <div key={item._id || index} className="text-sm">
        {item.productId ? (
          <>
            {item.productId.name} x {item.quantity}
            <span className="text-gray-500 ml-2">₹{item.productId.price * item.quantity}</span>
          </>
        ) : (
          <span className="text-gray-400">Product removed</span>
        )}
      </div>
    ));
  };

  const toggleExpand = (orderId) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  const handlePageChange = async (newPage) => {
    setLoading(true);
    setPage(newPage);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Order Management</CardTitle>
        <div className="flex gap-4 items-center mt-4">
          <Input
            placeholder="Filter by User ID"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="max-w-xs"
          />
          <Select value={sortOrder} onValueChange={setSortOrder}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort order" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="asc">Oldest First</SelectItem>
              <SelectItem value="desc">Newest First</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]"></TableHead>
                <TableHead>Order ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    <div className="flex items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
                      <span className="ml-2 text-gray-500">Loading orders...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-gray-500">
                    No orders found
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order) => (
                  <React.Fragment key={order._id}>
                    <TableRow 
                      className="cursor-pointer hover:bg-gray-50" 
                    >
                      <TableCell className="w-[50px]">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => toggleExpand(order._id)}
                        >
                          {expandedOrder === order._id ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell className="font-medium">{order.orderId}</TableCell>
                      <TableCell>
                        <div>{format(new Date(order.orderDate), 'MMM dd, yyyy')}</div>
                        <div className="text-sm text-gray-500">{format(new Date(order.orderDate), 'HH:mm')}</div>
                      </TableCell>
                      <TableCell>{renderUserInfo(order)}</TableCell>
                      <TableCell>
                        <div className="font-medium">₹{order.totalAmount + order.shippingAmount}</div>
                        {order.appliedCoupon && (
                          <div className="text-sm text-green-500">-₹{order.appliedCoupon.discountAmount} (Coupon)</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[order.status]}>
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {getAvailableStatuses(order.status).length > 0 && (
                          <Select
                            onValueChange={(value) => handleStatusUpdate(order.orderId, value)}
                            disabled={updatingOrder === order.orderId}
                          >
                            <SelectTrigger className="w-[180px]">
                              <SelectValue placeholder="Update status" />
                            </SelectTrigger>
                            <SelectContent>
                              {getAvailableStatuses(order.status).map((status) => (
                                <SelectItem key={status} value={status}>
                                  {status}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </TableCell>
                    </TableRow>
                    {expandedOrder === order._id && (
                      <TableRow>
                        <TableCell colSpan={7} className="bg-gray-50">
                          <div className="p-4 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <h4 className="font-medium mb-2">Order Details</h4>
                                <div className="space-y-2">
                                  <div className="text-sm">
                                    <span className="text-gray-500">Invoice ID:</span> {order.invoiceId}
                                  </div>
                                  <div className="text-sm">
                                    <span className="text-gray-500">Payment Status:</span> {order.paymentStatus}
                                  </div>
                                  <div className="text-sm">
                                    <span className="text-gray-500">Payment Method:</span> {order.isCashOnDelivery ? 'Cash on Delivery' : 'Online Payment'}
                                  </div>
                                  <div className="text-sm">
                                    <span className="text-gray-500">Expected Delivery:</span> {format(new Date(order.expectedDeliveryDate), 'MMM dd, yyyy')}
                                  </div>
                                </div>
                              </div>
                              <div>
                                <h4 className="font-medium mb-2">Delivery Address</h4>
                                <div className="text-sm">
                                  {order.deliveryAddress.flatno}, {order.deliveryAddress.street}<br />
                                  {order.deliveryAddress.city}, {order.deliveryAddress.state}<br />
                                  PIN: {order.deliveryAddress.pincode}
                                </div>
                              </div>
                            </div>
                            <div>
                              <h4 className="font-medium mb-2">Products</h4>
                              <div className="space-y-2">
                                {renderProductInfo(order.products)}
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <h4 className="font-medium mb-2">Store Details</h4>
                                <div className="text-sm">
                                  <div>{order.storeId.name}</div>
                                  <div className="text-gray-500">{order.storeId.email}</div>
                                  <div className="text-gray-500">{order.storeId.phone}</div>
                                </div>
                              </div>
                              <div>
                                <h4 className="font-medium mb-2">Price Breakdown</h4>
                                <div className="text-sm space-y-1">
                                  <div className="flex justify-between">
                                    <span>Subtotal:</span>
                                    <span>₹{order.totalAmount}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Shipping:</span>
                                    <span>₹{order.shippingAmount}</span>
                                  </div>
                                  {order.appliedCoupon && (
                                    <div className="flex justify-between text-green-500">
                                      <span>Coupon Discount:</span>
                                      <span>-₹{order.appliedCoupon.discountAmount}</span>
                                    </div>
                                  )}
                                  <div className="flex justify-between font-medium">
                                    <span>Total:</span>
                                    <span>₹{order.totalAmount + order.shippingAmount - (order.appliedCoupon?.discountAmount || 0)}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-between mt-4">
          <Button
            variant="outline"
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1 || loading}
          >
            {loading && page > 1 ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            Previous
          </Button>
          <span className="text-sm text-gray-500">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => handlePageChange(page + 1)}
            disabled={page === totalPages || loading}
          >
            {loading && page < totalPages ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            Next
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 