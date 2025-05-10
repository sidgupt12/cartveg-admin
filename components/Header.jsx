"use client"
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { authService } from '@/services/authService';
import { ArrowLeft } from 'lucide-react';

const Header = () => {
    const router = useRouter();
    const pathname = usePathname();
    const [showBackButton, setShowBackButton] = useState(false);
    
    useEffect(() => {
        const userRole = authService.getUserRole();
        setShowBackButton(userRole === 'superadmin' && pathname.includes('/store-dashboard'));
    }, [pathname]);
    
    const handleLogout = () => {
        // Call the logout function from authService
        authService.logout();
        
        // Redirect to the home page
        router.push('/');
    };

    const handleBackToSuperadmin = () => {
        router.push('/admin-dashboard/Store-Management');
    };
    
    return (
        <header className="w-full fixed top-0 left-0 z-50 backdrop-blur-md bg-white/30 border-b border-white/20 shadow-sm">
            <div className="mx-auto py-4 flex items-center justify-between px-4">
                <div className="flex items-center">
                    <Image
                        src="/logo.png"
                        alt="Logo"
                        width={150}
                        height={150}
                        className="inline-block ml-[-10px]"
                    />
                </div>
                <div className="flex items-center gap-4">
                    {showBackButton && (
                        <Button
                            variant="outline"
                            className="flex items-center gap-2"
                            onClick={handleBackToSuperadmin}
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to Superadmin
                        </Button>
                    )}
                    <Button 
                        variant="destructive" 
                        onClick={handleLogout}
                    >
                        Logout
                    </Button>  
                </div>
            </div>
        </header>
    );
};

export default Header;