import { useCart } from '../../context/CartContext';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';

export default function Cart() {
  const { items, removeFromCart, updateQuantity, total } = useCart();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 bg-white rounded-3xl border border-gray-100 shadow-sm min-h-[50vh]">
        <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
          <ShoppingBag className="w-10 h-10 text-gray-300" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900 mb-2">Your cart is empty</h2>
        <p className="text-gray-500 mb-8 max-w-sm text-center">Looks like you haven't added anything to your cart yet. Discover something new!</p>
        <Link to="/" className="px-8 py-3 bg-gray-900 text-white rounded-full font-medium hover:bg-gray-800 transition-colors shadow-sm">
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight text-gray-900">Shopping Cart</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden p-6 sm:p-8">
            <ul className="divide-y divide-gray-100">
              {items.map((item) => (
                <li key={item.productId} className="py-6 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center">
                  <div className="flex items-center flex-1">
                    <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-2xl bg-gray-50 border border-gray-100">
                      {item.image ? (
                        <img src={item.image} alt={item.title} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-xs text-gray-400">No Image</div>
                      )}
                    </div>
                    
                    <div className="ml-6 flex flex-1 flex-col">
                      <div className="flex justify-between text-base font-semibold text-gray-900 mb-1">
                        <h3><Link to={`/product/${item.productId}`} className="hover:text-blue-600 transition-colors">{item.title}</Link></h3>
                      </div>
                      <p className="text-sm font-medium text-gray-500 mb-4">₹{item.price.toLocaleString()}</p>
                      
                      <div className="flex items-center justify-between">
                         <div className="flex items-center border border-gray-200 rounded-xl bg-gray-50 p-1">
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                            className="p-1 rounded-lg hover:bg-white hover:text-gray-900 text-gray-500 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-200"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="px-4 py-1 font-medium text-sm w-12 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                            className="p-1 rounded-lg hover:bg-white hover:text-gray-900 text-gray-500 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-200"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.productId)}
                          className="font-medium text-red-500 hover:text-red-600 p-2 rounded-xl hover:bg-red-50 transition-colors flex items-center"
                        >
                          <Trash2 className="w-4 h-4 sm:mr-1.5" />
                          <span className="hidden sm:inline text-sm">Remove</span>
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="hidden sm:block ml-8 text-right self-stretch pt-2">
                    <p className="text-lg font-bold text-gray-900">₹{(item.price * item.quantity).toLocaleString()}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 sticky top-24">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>
            
            <div className="space-y-4 mb-6">
              <div className="flex items-center justify-between">
                <p className="text-gray-600">Subtotal</p>
                <p className="font-medium text-gray-900">₹{total.toLocaleString()}</p>
              </div>
              <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                <p className="text-gray-600">Shipping</p>
                <p className="font-medium text-green-600">Free</p>
              </div>
              <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                <p className="text-lg font-bold text-gray-900">Total</p>
                <p className="text-2xl font-bold text-gray-900">₹{total.toLocaleString()}</p>
              </div>
            </div>

            <button
              onClick={() => navigate('/checkout')}
              className="w-full bg-gray-900 text-white flex items-center justify-center p-4 rounded-2xl font-bold text-lg hover:bg-gray-800 transition-colors focus:ring-4 focus:ring-gray-200 shadow-sm group"
            >
              Proceed to Checkout
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </button>
            <div className="mt-4 flex items-center justify-center space-x-2 text-sm text-gray-500">
               <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
               <span>Secure checkout</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
