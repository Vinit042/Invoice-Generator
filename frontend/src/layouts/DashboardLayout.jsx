import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  Receipt,
  FileStack,
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/invoices', icon: FileText, label: 'Invoices' },
  { to: '/invoices/new', icon: Receipt, label: 'New Invoice' },
  { to: '/formats', icon: FileStack, label: 'Invoice Formats' },
  { to: '/customers', icon: Users, label: 'Customers' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function DashboardLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile header */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-white border-b">
        <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
        <span className="font-semibold text-primary">BGS Invoice</span>
        <div className="w-10" />
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={cn(
            'fixed inset-y-0 left-0 z-50 w-64 bg-white border-r transform transition-transform lg:translate-x-0 lg:static',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <div className="p-6 border-b">
            <h1 className="text-xl font-bold text-primary">BGS Invoice</h1>
            <p className="text-sm text-muted-foreground mt-1 truncate">{user?.companyName}</p>
          </div>
          <nav className="p-4 space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )
                }
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
            <Button variant="ghost" className="w-full justify-start gap-3" onClick={handleLogout}>
              <LogOut className="h-5 w-5" />
              Logout
            </Button>
          </div>
        </aside>

        {/* Overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        {/* Main content */}
        <main className="flex-1 min-h-screen p-4 lg:p-8 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
