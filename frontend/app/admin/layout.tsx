'use client';

import { useState } from 'react';
import { AdminSidebar } from '@/components/shared/admin-sidebar';
import { cn } from '@/lib/utils';
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar collapsed={collapsed} onCollapsedChange={setCollapsed} />
      <main className={cn(
        'flex-1 transition-all duration-300',
        collapsed ? 'ml-16' : 'ml-64'
      )}>
        {children}
      </main>
    </div>
  );
}
