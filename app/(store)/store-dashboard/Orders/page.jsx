'use client';

import React from 'react'
import StoreOrderManagement from '../../components/StoreOrderManagement';



function Orders() {
  console.log('Orders page component mounted'); // Debug log
  return (
    <div className="p-6">
      <StoreOrderManagement />
    </div>
  )
}

export default Orders