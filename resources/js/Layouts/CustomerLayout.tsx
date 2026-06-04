import { Link, usePage } from '@inertiajs/react';
import React, { ReactNode, useState, useRef, useEffect } from 'react';

interface Props {
  children: ReactNode;
  title?: string;
}

export default function CustomerLayout({ children, title }: Props) {
  const { auth } = usePage().props as any;
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      {/* Top Navbar */}
      <nav className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href={route('customer.menu')} className="flex items-center gap-2">
            <span className="text-2xl">🍛</span>
            <span className="font-bold text-lg text-gray-900 dark:text-white">Burjo Minang</span>
          </Link>
          
          <div className="flex items-center gap-4">
            {/* Desktop Navigation */}
            <div className="hidden sm:flex items-center gap-4 text-sm font-medium">
              <Link href={route('customer.menu')} className="text-gray-600 hover:text-amber-500">Menu</Link>
              <Link href={route('customer.orders')} className="text-gray-600 hover:text-amber-500">Pesanan Saya</Link>
            </div>
            
            {/* User Dropdown / Profile */}
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{auth.user.name}</span>
                <svg className={`w-4 h-4 text-gray-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </button>
              
              {isDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 py-1 z-50 animate-toast-in">
                  <Link href="#" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">Profil</Link>
                  <Link href={route('logout')} method="post" as="button" className="block w-full text-left px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">Logout</Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto p-4 pt-6">
        {title && (
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{title}</h1>
        )}
        {children}
      </main>

      {/* Mobile Bottom Navigation (Visible only on small screens) */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 h-16 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 flex items-center justify-around z-40">
        <Link href={route('customer.menu')} className="flex flex-col items-center gap-1 text-gray-500 hover:text-amber-500">
          <span className="text-xl">📋</span>
          <span className="text-[10px] font-medium uppercase tracking-wider">Menu</span>
        </Link>
        <Link href={route('customer.orders')} className="flex flex-col items-center gap-1 text-gray-500 hover:text-amber-500">
          <span className="text-xl">🧾</span>
          <span className="text-[10px] font-medium uppercase tracking-wider">Pesanan</span>
        </Link>
      </div>
    </div>
  );
}
