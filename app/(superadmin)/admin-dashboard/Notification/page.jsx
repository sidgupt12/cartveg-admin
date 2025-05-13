'use client';
import React from 'react';
import SendNotification from '../../components/SendNotification';
import { Toaster } from 'react-hot-toast';

const NotificationPage = () => {
  return (
    <div className="min-h-screen bg-none py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-green-600 mb-8 text-center">Notifications</h1>
        <SendNotification />
      </div>
      <Toaster position="top-right" />
    </div>
  );
};

export default NotificationPage;

