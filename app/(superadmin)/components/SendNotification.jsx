'use client';
import React, { useState } from 'react';
import { notificationService } from '@/services/superservice';
import { toast } from 'react-hot-toast';
import { Bell } from 'lucide-react';

const SendNotification = () => {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await notificationService.sendNotification({ title, body });
      toast.success(response.message || 'Notification sent successfully!');
      setTitle('');
      setBody('');
    } catch (error) {
      toast.error(error.message || 'Failed to send notification');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-8 bg-white rounded-2xl shadow-lg border border-gray-100">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
          <Bell className="h-6 w-6 text-green-600" />
        </div>
        <h2 className="text-2xl font-semibold text-gray-800">Send Notification</h2>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            Title
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 ease-in-out"
            placeholder="Enter notification title"
            required
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="body" className="block text-sm font-medium text-gray-700">
            Message
          </label>
          <textarea
            id="body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 ease-in-out min-h-[120px] resize-none"
            placeholder="Enter notification message"
            required
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-3 px-4 rounded-xl text-white font-medium transition-all duration-200 ease-in-out transform hover:scale-[1.02] active:scale-[0.98]
            ${isLoading 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-md hover:shadow-lg'
            }`}
        >
          <div className="flex items-center justify-center gap-2">
            {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Sending...</span>
              </>
            ) : (
              <>
                <Bell className="h-5 w-5" />
                <span>Send Notification</span>
              </>
            )}
          </div>
        </button>
      </form>
    </div>
  );
};

export default SendNotification; 