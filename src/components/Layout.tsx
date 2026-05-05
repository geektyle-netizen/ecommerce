import { Link, Outlet, useNavigate } from 'react-router-dom';
import { ShoppingCart, Heart, User, LogOut } from 'lucide-react';
import { AppUser } from '../App';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';

export default function Layout({ user }: { user: AppUser | null }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-gray-50 text-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link to="/" className="text-2xl font-extrabold tracking-tight text-indigo-900 font-display flex items-center space-x-2">
              <span className="bg-indigo-600 text-white rounded-xl w-10 h-10 flex items-center justify-center text-lg shadow-sm">E</span>
              <span>Shop.</span>
            </Link>
            
            <nav className="hidden md:flex space-x-10">
              <Link to="/" className="text-sm font-bold text-gray-600 hover:text-indigo-600 transition-colors uppercase tracking-widest">Home</Link>
              <a href="/#products" className="text-sm font-bold text-gray-600 hover:text-indigo-600 transition-colors uppercase tracking-widest">Catalog</a>
              {user?.role === 'admin' && (
                <Link to="/admin" className="text-sm font-bold text-purple-600 hover:text-purple-700 transition-colors uppercase tracking-widest flex items-center">
                  <span className="w-2 h-2 bg-purple-500 rounded-full mr-2 animate-pulse"></span> Admin Panel
                </Link>
              )}
            </nav>

            <div className="flex items-center space-x-2 sm:space-x-4 border-l border-gray-100 pl-4 sm:pl-6">
              {user ? (
                <>
                  <Link to="/wishlist" className="p-2.5 hover:bg-gray-100 rounded-full text-gray-600 hover:text-indigo-600 transition-colors relative" title="Wishlist">
                    <Heart className="w-5 h-5" />
                  </Link>
                  <Link to="/cart" className="p-2.5 hover:bg-gray-100 rounded-full text-gray-600 hover:text-indigo-600 transition-colors relative" title="Cart">
                    <ShoppingCart className="w-5 h-5" />
                  </Link>
                  <div className="relative group">
                    <button className="flex items-center space-x-2 p-2.5 focus:outline-none hover:bg-gray-100 rounded-full text-gray-600 hover:text-indigo-600 transition-colors">
                      <User className="w-5 h-5" />
                    </button>
                    <div className="absolute right-0 mt-3 w-56 bg-white border border-gray-100 rounded-2xl shadow-xl shadow-gray-200/50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all transform origin-top-right group-hover:translate-y-0 translate-y-2 z-50">
                      <div className="p-2">
                        <div className="px-4 py-3 mb-2 bg-gray-50 rounded-xl">
                          <p className="text-xs text-gray-500 font-medium mb-0.5">Signed in as</p>
                          <p className="text-sm font-bold text-gray-900 truncate">{user.email}</p>
                        </div>
                        <Link to="/orders" className="block px-4 py-2.5 text-sm font-medium text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors">My Orders</Link>
                        <Link to="/profile" className="block px-4 py-2.5 text-sm font-medium text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors">Profile</Link>
                        <div className="h-px bg-gray-100 my-2"></div>
                        <button onClick={handleLogout} className="w-full text-left px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl flex items-center transition-colors">
                          <LogOut className="w-4 h-4 mr-2" /> Logout
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <Link to="/login" className="px-6 py-2.5 rounded-full bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-200 transition-all active:scale-95 tracking-wide">
                  Log In
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 pt-12 pb-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-lg font-semibold tracking-tight text-gray-900 mb-4">E-Shop</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Your one-stop destination for the latest products with the best prices.
              </p>
            </div>
            {/* Quick Links */}
            <div>
              <h4 className="text-sm font-semibold tracking-wider text-gray-900 uppercase mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li><Link to="/about" className="hover:text-gray-900">About Us</Link></li>
                <li><Link to="/contact" className="hover:text-gray-900">Contact</Link></li>
                <li><Link to="/faq" className="hover:text-gray-900">FAQ</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-200 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-xs text-gray-500">
              &copy; {new Date().getFullYear()} E-Shop. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
