"use client"
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import React from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/authService';

const Header = () => {
    const router = useRouter();
    
    const handleLogout = () => {
        // Call the logout function from authService
        authService.logout();
        
        // Redirect to the home page
        router.push('/');
    };
    
    return (
        <header className="w-full fixed top-0 left-0 z-50 backdrop-blur-md bg-white/30 border-b border-white/20 shadow-sm">
            <div className="mx-auto py-4 flex items-center justify-between">
                <Image
                    src="/logo.png"
                    alt="Logo"
                    width={150}
                    height={150}
                    className="inline-block ml-[-10px]"
                />
                <div>
                    <Button 
                        variant="destructive" 
                        className="mr-4" 
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