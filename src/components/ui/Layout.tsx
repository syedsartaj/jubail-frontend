
import React from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { UserRole } from '../../types';
import { AuthService } from '../../services/auth';
import { 
  LayoutDashboard, 
  Ticket, 
  CalendarDays, 
  QrCode, 
  LogOut, 
  Anchor, 
  Menu,
  X,
  ShoppingBag,
  Home,
  Users,
  Tent,
  Settings,
  User as UserIcon,
  Tag,
  Monitor,
  BarChart3,
  Layers
} from 'lucide-react';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isAdmin = location.pathname.startsWith('/admin');
  const isStaff = location.pathname.startsWith('/staff');
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  
  const user = AuthService.getCurrentUser();

  const handleLogout = () => {
    AuthService.logout();
    navigate(isAdmin || isStaff ? '/admin/login' : '/');
  };

  if (isAdmin && location.pathname === '/admin/login') {
    return <>{children}</>;
  }
  
  if (location.pathname === '/login') {
    return <>{children}</>;
  }

  // ADMIN & STAFF LAYOUT (Shared Sidebar Structure)
  if (isAdmin || isStaff) {
    let navItems: any[] = [];
    
    if (user?.role === 'ADMIN') {
      navItems = [
        { icon: <LayoutDashboard size={20} />, label: 'Dashboard', path: '/admin' },
        { icon: <BarChart3 size={20} />, label: 'Sales Reports', path: '/admin/reports' },
        { icon: <Monitor size={20} />, label: 'Staff Console (POS)', path: '/staff/pos' },
        { icon: <Layers size={20} />, label: 'Categories', path: '/admin/categories' },
        { icon: <Tent size={20} />, label: 'Activities', path: '/admin/activities' },
        { icon: <CalendarDays size={20} />, label: 'Schedule', path: '/admin/slots' },
        { icon: <Ticket size={20} />, label: 'Tickets', path: '/admin/tickets' },
        { icon: <Users size={20} />, label: 'Staff & Hours', path: '/admin/staff' },
        { icon: <Tag size={20} />, label: 'Coupons', path: '/admin/coupons' },
        { icon: <QrCode size={20} />, label: 'Scanner', path: '/admin/scan' },
        { icon: <Settings size={20} />, label: 'Settings', path: '/admin/settings' },
      ];
    } else if (user?.role === 'STAFF') {
      navItems = [
        { icon: <Monitor size={20} />, label: 'Bookings (POS)', path: '/staff/pos' },
        { icon: <QrCode size={20} />, label: 'Ticket Scanner', path: '/admin/scan' }, // Reuse scanner page for staff
      ];
    }

    return (
      <div className="flex h-screen bg-gray-100">
        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 z-40 bg-gray-900 bg-opacity-50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transform transition-transform duration-200 lg:translate-x-0 lg:static ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="flex items-center justify-between p-6 border-b border-slate-800">
            <div className="flex items-center space-x-2 font-bold text-xl">
              <Anchor className="text-teal-400" />
              <span>{user?.role === 'ADMIN' ? 'Admin Panel' : 'Staff Portal'}</span>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-400 hover:text-white">
              <X size={24} />
            </button>
          </div>
          <nav className="p-4 space-y-2 h-[calc(100%-140px)] overflow-y-auto no-scrollbar">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  location.pathname === item.path 
                    ? 'bg-teal-600 text-white' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
          <div className="absolute bottom-0 w-full p-4 border-t border-slate-800 bg-slate-900">
            <div className="px-4 py-2 text-xs text-slate-500 uppercase tracking-widest mb-2">
              Signed in as {user?.name}
            </div>
            <button 
              onClick={handleLogout}
              className="flex items-center space-x-3 px-4 py-3 w-full text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <LogOut size={20} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="bg-white shadow-sm lg:hidden flex items-center justify-between p-4">
            <button onClick={() => setSidebarOpen(true)} className="text-gray-600">
              <Menu size={24} />
            </button>
            <span className="font-semibold text-gray-800">{user?.role === 'ADMIN' ? 'Admin Dashboard' : 'Staff Console'}</span>
            <div className="w-6" /> {/* Spacer */}
          </header>
          <main className="flex-1 overflow-auto p-4 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    );
  }

  // CUSTOMER LAYOUT
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <nav className="bg-white border-b sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-2 text-indigo-600 font-bold text-xl">
                <Anchor className="h-8 w-8" />
                <span>RiverRun</span>
              </Link>
              <div className="hidden sm:ml-8 sm:flex sm:space-x-8">
                <Link to="/" className="text-gray-900 hover:text-indigo-600 px-1 pt-1 text-sm font-medium">Home</Link>
                <Link to="/shop" className="text-gray-900 hover:text-indigo-600 px-1 pt-1 text-sm font-medium">Tickets & Activities</Link>
                {user && (
                  <Link to="/my-bookings" className="text-gray-900 hover:text-indigo-600 px-1 pt-1 text-sm font-medium">My Bookings</Link>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <Link to="/checkout" className="text-gray-500 hover:text-indigo-600 relative">
                <ShoppingBag size={24} />
              </Link>

              {user ? (
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                    <UserIcon size={16} />
                    <span className="hidden sm:inline">{user.name}</span>
                  </div>
                  <button 
                    onClick={handleLogout}
                    className="text-gray-500 hover:text-red-600 text-sm font-medium"
                  >
                    Log out
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                   <Link to="/login" className="text-gray-900 hover:text-indigo-600 text-sm font-medium">
                    Log in
                  </Link>
                  <Link to="/admin/login" className="text-gray-400 hover:text-gray-600 text-sm">
                    Admin/Staff
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
      <main className="flex-1">
        {children}
      </main>
      <footer className="bg-white border-t mt-12 py-12">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-500">
          <p>© 2024 RiverRun Adventures. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};
