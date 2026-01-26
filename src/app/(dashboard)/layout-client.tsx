'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Session } from 'next-auth';
import {
  LayoutDashboard,
  KanbanSquare,
  Package,
  Smartphone,
  LogOut,
  Menu,
  User,
  Bell,
  X,
  ChevronRight,
  MessageSquare
} from 'lucide-react';

interface NavItem {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  iconBg: string;
}

const navItems: NavItem[] = [
  { href: '/', icon: LayoutDashboard, label: 'Dashboard', iconBg: 'group-hover:bg-zinc-900 dark:group-hover:bg-zinc-100' },
  { href: '/kanban', icon: KanbanSquare, label: 'Kanban', iconBg: 'group-hover:bg-indigo-600' },
  { href: '/products', icon: Package, label: 'Produtos', iconBg: 'group-hover:bg-emerald-600' },
  { href: '/instances', icon: Smartphone, label: 'Instâncias', iconBg: 'group-hover:bg-green-600' },
  { href: '/webproxy', icon: MessageSquare, label: 'WhatsApp Web', iconBg: 'group-hover:bg-blue-600' },
];

interface User {
  name?: string | null;
  email?: string | null;
}

interface SessionData {
  user?: User;
}

export default function DashboardLayoutClient({
  children,
  session,
}: {
  children: React.ReactNode;
  session: Session | null;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setSidebarOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [sidebarOpen]);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 font-sans">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-2xl border-r border-zinc-200 dark:border-zinc-800 transform transition-transform duration-300 ease-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-zinc-100 dark:border-zinc-800/50">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-9 h-9 bg-gradient-to-br from-zinc-900 to-zinc-700 dark:from-zinc-100 dark:to-zinc-300 rounded-xl flex items-center justify-center shadow-lg shadow-zinc-900/20 dark:shadow-zinc-100/10">
                <span className="text-white dark:text-zinc-900 font-bold text-lg tracking-tight">H</span>
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-zinc-950" />
            </div>
            <span className="text-lg font-semibold text-zinc-900 dark:text-white tracking-tight">Hype CRM</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-zinc-500" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-0.5">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center gap-3 px-4 py-2.5 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100/80 dark:hover:bg-zinc-800/50 rounded-xl transition-all duration-200 ${
                pathname === item.href ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white' : ''
              }`}
            >
              <div className={`w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 ${item.iconBg} transition-colors flex items-center justify-center`}>
                <item.icon className="w-4 h-4 group-hover:text-white transition-colors" />
              </div>
              <span className="font-medium text-sm">{item.label}</span>
              <ChevronRight className="w-4 h-4 ml-auto opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 text-zinc-400" />
            </Link>
          ))}
        </nav>

        {/* User Section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-zinc-100 dark:border-zinc-800/50">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <User className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-zinc-900 dark:text-white truncate">
                {session?.user?.name || 'Usuário'}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                {session?.user?.email || 'usuario@exemplo.com'}
              </p>
            </div>
          </div>
          <form action="/api/auth/signout" method="POST">
            <button
              type="submit"
              className="w-full flex items-center gap-2.5 px-3 py-2 text-zinc-500 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-all duration-200 text-sm font-medium"
            >
              <LogOut className="w-4 h-4" />
              <span>Sair</span>
            </button>
          </form>
        </div>
      </aside>

      {/* Mobile Overlay */}
      <div
        className={`fixed inset-0 z-40 bg-zinc-950/50 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Main Content Wrapper */}
      <div className="lg:pl-64 min-h-screen">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 h-16 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-200/50 dark:border-zinc-800/50">
          <div className="flex items-center justify-between h-full px-4 lg:px-8">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <Menu className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button className="relative p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors group">
                <Bell className="w-5 h-5 text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-zinc-950" />
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
