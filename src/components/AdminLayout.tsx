import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingBag, Users, FileText, Settings as SettingsIcon, ArrowLeft, LogOut, Layers, Tags, MessageCircle } from 'lucide-react';
import { AppUser } from '../App';
import { auth, db } from '../firebase';
import { signOut } from 'firebase/auth';
import { collection, query, onSnapshot, where } from 'firebase/firestore';

export default function AdminLayout({ user }: { user: AppUser | null }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);

  useEffect(() => {
    // Get total unread by querying all chats where unreadCountAdmin > 0
    const q = query(collection(db, 'chats'), where('unreadCountAdmin', '>', 0));
    const unsubscribe = onSnapshot(q, (snapshot) => {
       const count = snapshot.docs.reduce((acc, doc) => acc + doc.data().unreadCountAdmin, 0);
       setUnreadMessagesCount(count);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  const navItems = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { name: 'Categories', path: '/admin/categories', icon: Layers },
    { name: 'Subcategories', path: '/admin/subcategories', icon: Tags },
    { name: 'Products', path: '/admin/products', icon: Package },
    { name: 'Orders', path: '/admin/orders', icon: ShoppingBag },
    { name: 'Users', path: '/admin/users', icon: Users },
    { name: 'Reports', path: '/admin/reports', icon: FileText },
    { name: 'Settings', path: '/admin/settings', icon: SettingsIcon },
    { name: 'Messages', path: '/admin/messages', icon: MessageCircle, badge: unreadMessagesCount }
  ];

  return (
    <div className="min-h-screen flex bg-gray-50 text-gray-900 font-sans">
      {/* Sidebar sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col fixed h-full z-10 transition-transform">
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <Link to="/admin" className="text-xl font-bold tracking-tight text-gray-900">Admin Panel</Link>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/admin' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                  isActive 
                    ? 'bg-gray-100 text-gray-900' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center">
                  <item.icon className={`w-5 h-5 mr-3 ${isActive ? 'text-gray-900' : 'text-gray-400'}`} />
                  {item.name}
                </div>
                {(item.badge || 0) > 0 && (
                  <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <Link to="/" className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 rounded-xl hover:bg-gray-50 hover:text-gray-900 transition-colors mb-2">
            <ArrowLeft className="w-5 h-5 mr-3 text-gray-400" />
            Back to Store
          </Link>
          <button onClick={handleLogout} className="flex items-center w-full px-3 py-2 text-sm font-medium text-red-600 rounded-xl hover:bg-red-50 transition-colors">
            <LogOut className="w-5 h-5 mr-3 text-red-400" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8">
        <div className="max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
