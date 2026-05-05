import { useState, useEffect } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { ShoppingCart, Heart, User, LogOut } from 'lucide-react';
import { AppUser } from '../App';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';

export default function Layout({ user }: { user: AppUser | null }) {
  const navigate = useNavigate();
  const { items } = useCart();
  const { productIds } = useWishlist();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const container = document.getElementById('profile-menu-container');
      if (container && !container.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  const cartCount = items.reduce((acc, item) => acc + item.quantity, 0);
  const wishlistCount = productIds.length;

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
                    <Heart className="w-5 h-5" fill={wishlistCount > 0 ? "currentColor" : "none"} />
                    {wishlistCount > 0 && (
                      <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                        {wishlistCount}
                      </span>
                    )}
                  </Link>
                  <Link to="/cart" className="p-2.5 hover:bg-gray-100 rounded-full text-gray-600 hover:text-indigo-600 transition-colors relative" title="Cart">
                    <ShoppingCart className="w-5 h-5" />
                    {cartCount > 0 && (
                      <span className="absolute top-1 right-1 bg-indigo-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                        {cartCount}
                      </span>
                    )}
                  </Link>
                  <div className="relative" id="profile-menu-container">
                    <button 
                      onClick={(e) => {
                         e.stopPropagation();
                         setIsProfileOpen(!isProfileOpen);
                      }}
                      className="flex items-center space-x-2 p-2.5 focus:outline-none hover:bg-gray-100 rounded-full text-gray-600 hover:text-indigo-600 transition-colors"
                    >
                      <User className="w-5 h-5" />
                    </button>
                    {isProfileOpen && (
                      <div className="absolute right-0 mt-3 w-56 bg-white border border-gray-100 rounded-2xl shadow-xl shadow-gray-200/50 z-50">
                        <div className="p-2">
                          <div className="px-4 py-3 mb-2 bg-gray-50 rounded-xl">
                            <p className="text-xs text-gray-500 font-medium mb-0.5">Signed in as</p>
                            <p className="text-sm font-bold text-gray-900 truncate">{user.email}</p>
                          </div>
                          {user.role === 'admin' && (
                            <Link to="/admin" onClick={() => setIsProfileOpen(false)} className="block md:hidden px-4 py-2.5 mb-1 text-sm font-bold text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-xl transition-colors">Admin Panel</Link>
                          )}
                          <Link to="/orders" onClick={() => setIsProfileOpen(false)} className="block px-4 py-2.5 text-sm font-medium text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors">My Orders</Link>
                          <Link to="/profile" onClick={() => setIsProfileOpen(false)} className="block px-4 py-2.5 text-sm font-medium text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors">Profile</Link>
                          <div className="h-px bg-gray-100 my-2"></div>
                          <button onClick={handleLogout} className="w-full text-left px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl flex items-center transition-colors">
                            <LogOut className="w-4 h-4 mr-2" /> Logout
                          </button>
                        </div>
                      </div>
                    )}
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
