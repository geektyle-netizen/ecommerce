import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../firebase';
import { AppUser } from '../../App';
import { Package, Truck, CheckCircle, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function OrderTracking({ user }: { user: AppUser }) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const q = query(
          collection(db, 'orders'),
          where('userId', '==', user.uid)
        );
        const querySnapshot = await getDocs(q);
        const fetchedOrders = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...(doc.data() as object)
        })) as any[];
        
        // Manual sort since compound queries might require a composite index that isn't built yet
        fetchedOrders.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
        setOrders(fetchedOrders);
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'orders');
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [user.uid]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-6 h-6 text-yellow-500" />;
      case 'processing': return <Package className="w-6 h-6 text-blue-500" />;
      case 'shipped': return <Truck className="w-6 h-6 text-purple-500" />;
      case 'delivered': return <CheckCircle className="w-6 h-6 text-green-500" />;
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
              
              <div className="p-6">
                <div className="flex items-center space-x-4 mb-6">
                  {getStatusIcon(order.status)}
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{statusMap[order.status] || order.status}</h3>
                    {order.status === 'delivered' && (
                      <p className="text-sm text-gray-500">Your package has been delivered securely.</p>
                    )}
                  </div>
                </div>

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
    </div>
  );
}
