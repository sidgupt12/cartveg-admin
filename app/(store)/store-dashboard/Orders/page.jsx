'use client';

import React from 'react'
import OrderManagement from '@/components/OrderManagement'

function Orders() {
  console.log('Orders page component mounted'); // Debug log
  return (
    <div className="p-6">
      <OrderManagement />
    </div>
  )
}

export default Orders