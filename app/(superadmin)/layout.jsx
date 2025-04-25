import React from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import Header from '@/components/Header';
import { AppSidebar } from './components/super-sidebar';

export default function SuperLayout({ children }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <div className="flex flex-1 pt-16"> {/* Add pt-16 (4rem) for header height */}
        <SidebarProvider>
        <AppSidebar/>
          <main className="flex-1 p-4">
            <SidebarTrigger className="mb-4" />
            {children}
          </main>
        </SidebarProvider>
      </div>
    </div>
  );
}