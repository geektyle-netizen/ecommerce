import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../firebase';
import { AppUser } from '../../App';
import { Package, Truck, CheckCircle, Clock, XCircle, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function OrderTracking({ user }: { user: AppUser }) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Captcha State
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<string | null>(null);
  const [captchaText, setCaptchaText] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');

  const generateCaptcha = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 5; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaText(result);
    setCaptchaInput('');
  };

  const getOrders = async () => {
      try {
        const q = query(
          collection(db, 'orders'),
          where('userId', '==', user.uid)
        );
        const querySnapshot = await getDocs(q);
        const fetchedOrders = querySnapshot.docs.map(d => ({
          id: d.id,
          ...(d.data() as object)
        })) as any[];
        
        fetchedOrders.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
        setOrders(fetchedOrders);
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'orders');
      } finally {
        setLoading(false);
      }
  };

  useEffect(() => {
    getOrders();
  }, [user.uid]);

  const initCancelOrder = (orderId: string) => {
    setOrderToCancel(orderId);
    generateCaptcha();
    setShowCancelModal(true);
  };

  const executeCancel = async () => {
     if (captchaInput.trim().toUpperCase() !== captchaText) {
        toast.error("Captcha mismatch. Please try again.");
        generateCaptcha();
        return;
     }

     if (!orderToCancel) return;

     try {
       await updateDoc(doc(db, 'orders', orderToCancel), {
          status: 'cancelled',
          updatedAt: serverTimestamp()
       });
       toast.success("Order cancelled successfully");
       setShowCancelModal(false);
       setOrderToCancel(null);
       getOrders();
     } catch (err) {
       handleFirestoreError(err, OperationType.UPDATE, `orders/${orderToCancel}`);
     }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-6 h-6 text-yellow-500" />;
      case 'processing': return <Package className="w-6 h-6 text-blue-500" />;
      case 'shipped': return <Truck className="w-6 h-6 text-purple-500" />;
      case 'delivered': return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'cancelled': return <XCircle className="w-6 h-6 text-red-500" />;
      default: return <Clock className="w-6 h-6 text-gray-500" />;
    }
  };

  const statusMap: Record<string, string> = {
    'pending': 'Order Placed',
    'processing': 'Processing',
    'shipped': 'On the Way',
    'delivered': 'Delivered',
    'cancelled': 'Cancelled'
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold tracking-tight text-gray-900">Your Orders</h1>

      {loading ? (
        <div className="text-center py-20">Loading orders...</div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-medium text-gray-900 mb-2">No orders found</h2>
          <p className="text-gray-500 mb-6">Looks like you haven't placed an order yet.</p>
          <Link to="/" className="px-6 py-2.5 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="bg-gray-50 p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-12 w-full text-sm">
                  <div>
                    <h3 className="text-gray-500 mb-1 uppercase tracking-wider text-xs font-semibold">Order Placed</h3>
                    <p className="font-medium text-gray-900">
                      {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-gray-500 mb-1 uppercase tracking-wider text-xs font-semibold">Total</h3>
                    <p className="font-medium text-gray-900">₹{order.totalAmount?.toLocaleString()}</p>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <h3 className="text-gray-500 mb-1 uppercase tracking-wider text-xs font-semibold">Order #</h3>
                    <p className="font-medium text-gray-900 font-mono truncate" title={order.id}>{order.id}</p>
                  </div>
                  {order.paymentId && (
                    <div className="col-span-2 sm:col-span-1 text-right sm:text-left">
                       <h3 className="text-gray-500 mb-1 uppercase tracking-wider text-xs font-semibold">Payment Id</h3>
                       <p className="font-medium text-gray-900 font-mono truncate" title={order.paymentId}>{order.paymentId}</p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <div className="flex items-center space-x-4 mb-4 sm:mb-0">
                  {getStatusIcon(order.status)}
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{statusMap[order.status] || order.status}</h3>
                    {order.status === 'delivered' && (
                      <p className="text-sm text-gray-500">Your package has been delivered securely.</p>
                    )}
                  </div>
                </div>
                {['pending', 'processing'].includes(order.status) && (
                   <button 
                     onClick={() => initCancelOrder(order.id)}
                     className="px-4 py-2 border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl text-sm font-bold transition-colors"
                   >
                     Cancel Order
                   </button>
                )}
              </div>

              <div className="p-6">
                <div className="space-y-4">
                  {order.items?.map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between py-2 border-t border-gray-50 pt-4">
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg mr-4 flex items-center justify-center text-gray-400">
                          <Package className="w-6 h-6" />
                        </div>
                        <div>
                          <Link to={`/product/${item.productId}`} className="font-medium text-gray-900 hover:text-blue-600 transition-colors">
                            Product ID: {item.productId ? item.productId.slice(0, 8) : 'Unknown'}...
                          </Link>
                          <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                        </div>
                      </div>
                      <div className="font-medium text-gray-900">
                        ₹{(item.priceAtPurchase * item.quantity).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Cancel Order Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl shadow-red-200/20 transform border border-gray-100">
             <div className="flex items-center space-x-3 text-red-600 mb-4">
                <AlertTriangle className="w-8 h-8" />
                <h2 className="text-xl font-bold">Cancel Order</h2>
             </div>
             <p className="text-gray-600 mb-6 text-sm">
                Are you sure you want to cancel this order? This action cannot be undone. To verify, please enter the characters below:
             </p>
             
             <div className="bg-gray-100 p-3 flex justify-center items-center rounded-xl mb-4 select-none">
                <span className="font-mono text-2xl font-bold tracking-[0.5em] text-gray-800 line-through decoration-gray-400 decoration-2">{captchaText}</span>
             </div>
             
             <input 
               type="text" 
               placeholder="Enter CAPTCHA" 
               value={captchaInput}
               onChange={e => setCaptchaInput(e.target.value)}
               className="w-full border border-gray-300 rounded-xl px-4 py-3 font-medium outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all text-center uppercase"
             />

             <div className="mt-8 flex space-x-3">
               <button 
                 onClick={() => { setShowCancelModal(false); setOrderToCancel(null); }}
                 className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
               >
                 Go Back
               </button>
               <button 
                 onClick={executeCancel}
                 disabled={!captchaInput.trim()}
                 className="flex-1 py-3 bg-red-600 disabled:bg-red-300 text-white font-bold rounded-xl hover:bg-red-700 transition-colors"
               >
                 Confirm Cancel
               </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
