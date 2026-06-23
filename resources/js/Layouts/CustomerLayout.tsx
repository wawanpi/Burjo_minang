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
  const currentRoute = (name: string) => (route() as any).current(name);

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
    <div className="min-h-screen bg-gray-50 pb-20 font-sans">
      {/* Top Navbar (Disembunyikan di Mobile, diganti Bottom Nav) */}
      <nav className="hidden sm:flex sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-200/80 shadow-sm">
        <div className="max-w-7xl mx-auto w-full px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href={route('customer.menu')} className="flex items-center gap-3 group">
            <span className="font-sans text-xl font-extrabold text-[#990000] tracking-widest leading-none">BURJO MINANG</span>
          </Link>
          
          <div className="flex items-center gap-4">
            {/* Desktop Navigation */}
            <div className="hidden sm:flex items-center gap-1">
              <Link 
                href={route('customer.menu')} 
                className={`px-4 py-2 rounded-full text-sm font-bold tracking-wide transition-all duration-300 ${
                  currentRoute('customer.menu') 
                    ? 'bg-[#c70024] text-white shadow-md shadow-red-500/20' 
                    : 'text-gray-600 hover:text-[#c70024] hover:bg-red-50'
                }`}
              >
                Menu
              </Link>
              <Link 
                href={route('customer.orders')} 
                className={`px-4 py-2 rounded-full text-sm font-bold tracking-wide transition-all duration-300 ${
                  currentRoute('customer.orders') 
                    ? 'bg-[#c70024] text-white shadow-md shadow-red-500/20' 
                    : 'text-gray-600 hover:text-[#c70024] hover:bg-red-50'
                }`}
              >
                Pesanan Saya
              </Link>
            </div>
            
            {/* User Dropdown / Profile */}
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 hover:bg-red-50 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#c70024]/30"
              >
                <span className="text-sm font-bold text-gray-700">{auth.user.name}</span>
                <svg className={`w-4 h-4 text-gray-500 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </button>
              
              {isDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 py-1 z-50 animate-toast-in">
                  <Link href="#" className="block px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-red-50 hover:text-[#c70024] transition-colors rounded-xl mx-1">Profil</Link>
                  <Link href={route('logout')} method="post" as="button" className="block w-full text-left px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 transition-colors rounded-xl mx-1">Logout</Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main>
        {children}
      </main>

      {/* Mobile Bottom Navigation (Visible only on small screens) */}
      <nav className="sm:hidden fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 flex justify-between items-center px-6 py-3 z-40 pb-safe shadow-[0_-4px_12px_-1px_rgba(0,0,0,0.08)]">
        {/* Menu Beranda */}
        <Link href={route('customer.menu')} className="flex flex-col items-center gap-1 group w-16">
          <div className={`p-1.5 rounded-full transition-all duration-300 ${currentRoute('customer.menu') ? 'bg-red-50' : 'group-hover:bg-gray-50'}`}>
            <svg className={`w-6 h-6 transition-colors duration-300 ${currentRoute('customer.menu') ? 'text-[#c70024] fill-[#c70024]' : 'text-gray-400 stroke-[1.5px]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <span className={`text-[10px] font-extrabold tracking-wide transition-colors duration-300 ${currentRoute('customer.menu') ? 'text-[#c70024]' : 'text-gray-400'}`}>Beranda</span>
        </Link>

        {/* Pesanan */}
        <Link href={route('customer.orders')} className="flex flex-col items-center gap-1 group w-16">
          <div className={`p-1.5 rounded-full transition-all duration-300 ${currentRoute('customer.orders') ? 'bg-red-50' : 'group-hover:bg-gray-50'}`}>
            <svg className={`w-6 h-6 transition-colors duration-300 ${currentRoute('customer.orders') ? 'text-[#c70024] stroke-[#c70024] stroke-2' : 'text-gray-400 stroke-[1.5px]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <span className={`text-[10px] font-extrabold tracking-wide transition-colors duration-300 ${currentRoute('customer.orders') ? 'text-[#c70024]' : 'text-gray-400'}`}>Pesanan</span>
        </Link>

        {/* Profil Menu (Trigger Logout) */}
        <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="flex flex-col items-center gap-1 group w-16 relative">
          <div className={`p-1.5 rounded-full transition-all duration-300 ${isDropdownOpen ? 'bg-red-50' : 'group-hover:bg-gray-50'}`}>
            <svg className={`w-6 h-6 transition-colors duration-300 ${isDropdownOpen ? 'text-[#c70024] stroke-[#c70024] stroke-2' : 'text-gray-400 stroke-[1.5px]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <span className={`text-[10px] font-extrabold tracking-wide transition-colors duration-300 ${isDropdownOpen ? 'text-[#c70024]' : 'text-gray-400'}`}>Profil</span>
          
          {/* Dropdown Mobile Profil */}
          {isDropdownOpen && (
            <div className="absolute bottom-16 right-0 w-44 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 animate-toast-in z-50 overflow-hidden">
              <div className="px-4 py-2.5 border-b border-gray-100 mb-1 text-left">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Hai,</p>
                <p className="text-sm font-extrabold text-gray-900 truncate">{auth.user.name}</p>
              </div>
              <Link href={route('logout')} method="post" as="button" className="w-full text-left px-4 py-2.5 text-sm font-bold text-[#c70024] hover:bg-red-50 transition-colors">
                🚪 Logout Keluar
              </Link>
            </div>
          )}
        </button>
      </nav>
    </div>
  );
}
