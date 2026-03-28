"use client";

import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import Image from "next/image";
import { Menu, X } from "lucide-react";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#F8FAFC] dark:bg-[#0F172A]">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] z-40 relative">
        <Image 
          src="/logo.png" 
          alt="COMPERS Logo" 
          width={120} 
          height={40} 
          className="object-contain dark:brightness-0 dark:invert" 
        />
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <Sidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
      
      {/* Main Content Area */}
      <main className="flex-1 md:ml-[240px] p-4 md:px-8 md:pt-8 md:pb-2 animate-in fade-in duration-500 flex flex-col items-center w-full overflow-x-hidden">
        <div className="w-full max-w-[1600px]">
          {children}
        </div>
      </main>

      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
}
