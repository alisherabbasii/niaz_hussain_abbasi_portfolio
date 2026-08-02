"use client";

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, FileEdit, Settings, LogOut } from 'lucide-react';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
    router.refresh(); // Crucial to update the middleware visually
  };

  const navItems = [
    { label: 'Manage Blogs', href: '/admin/blogs', icon: LayoutDashboard },
    { label: 'Write New Blog', href: '/admin/write', icon: FileEdit },
  ];

  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[#f8faf9] flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white border-r border-gray-100 flex flex-col h-auto md:h-screen sticky top-0 md:sticky z-10 shadow-sm">
        <div className="p-6">
          <Link href="/" className="inline-block px-4 py-1.5 bg-primary/10 text-primary font-bold uppercase tracking-wider text-xs rounded-full mb-2">
            Return to Site
          </Link>
          <div className="text-xl font-black text-secondary tracking-tight">Admin<span className="text-primary">Panel</span></div>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all ${
                  isActive
                    ? 'bg-primary text-white shadow-[0_4px_15px_rgb(52,211,153,0.3)]'
                    : 'text-secondary/70 hover:bg-gray-50 hover:text-primary'
                }`}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-100 mt-auto">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-4 py-3 rounded-2xl font-bold text-red-500 hover:bg-red-50 transition-all"
          >
            <LogOut size={18} />
            Secure Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-x-hidden pt-6">
        {children}
      </main>
    </div>
  );
}
