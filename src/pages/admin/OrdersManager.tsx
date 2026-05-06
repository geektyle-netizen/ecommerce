import { useState, useEffect } from 'react';
import { collection, query, getDocs, doc, setDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../firebase';
import { Package, Truck, CheckCircle, Clock, Eye, X, Mail, Phone, MapPin, User, Hash } from 'lucide-react';

export default function OrdersManager() {
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<Record<string, any>>({});
  const [users, setUsers] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [ordersSnap, productsSnap, usersSnap] = await Promise.all([
        getDocs(query(collection(db, 'orders'), orderBy('createdAt', 'desc'))),
        getDocs(collection(db, 'products')),
        getDocs(collection(db, 'users'))
      ]);

      const productsMap: Record<string, any> = {};
      productsSnap.docs.forEach(d => { productsMap[d.id] = d.data(); });
      setProducts(productsMap);

      const usersMap: Record<string, any> = {};
      usersSnap.docs.forEach(d => { usersMap[d.id] = d.data(); });
      setUsers(usersMap);

      setOrders(ordersSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'orders');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    setUpdating(orderId);
    try {
      await setDoc(doc(db, 'orders', orderId), {
        status: newStatus,
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
    } finally {
      setUpdating(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'processing': return <Package className="w-5 h-5 text-blue-500" />;
      case 'shipped': return <Truck className="w-5 h-5 text-purple-500" />;
      case 'delivered': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'cancelled': return <X className="w-5 h-5 text-red-500" />;
      default: return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Manage Orders</h1>
        <button 
          onClick={fetchData} 
          className="text-sm text-indigo-600 font-medium hover:text-indigo-700"
          disabled={loading}
        >
          {loading ? 'Refreshing...' : 'Refresh List'}
        </button>
      </div>

      {loading && orders.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-gray-100">
           <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4"></div>
           <p className="text-gray-500">Loading orders...</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          {orders.length === 0 ? (
            <div className="p-20 text-center text-gray-500">No orders found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Order ID</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Customer</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Amount</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Date</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-widest">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-50">
                  {orders.map((order) => {
                    const user = users[order.userId];
                    return (
                      <tr key={order.id} className="hover:bg-gray-50 transition-colors group">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-400">
                          #{order.id.slice(0, 8)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-gray-900">{order.address?.name || users[order.userId]?.email || 'Unknown User'}</div>
                          <div className="text-xs text-gray-500">{order.userId.slice(0, 8)}...</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                          ₹{order.totalAmount?.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getStatusColor(order.status)}`}>
                            {getStatusIcon(order.status)}
                            <span className="ml-1.5">{order.status}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                          <button 
                            onClick={() => setSelectedOrder(order)}
                            className="inline-flex items-center px-3 py-1.5 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all text-xs font-bold"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4 mr-1.5" />
                            View
                          </button>
                          <select
                            value={order.status}
                            onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                            disabled={updating === order.id}
                            className="text-xs font-bold border border-gray-100 rounded-xl px-3 py-1.5 outline-none focus:ring-2 focus:ring-indigo-500 bg-white shadow-sm cursor-pointer"
                          >
                            <option value="pending">Pending</option>
                            <option value="processing">Processing</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-gray-100">
             <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
               <div>
                  <h2 className="text-xl font-black text-gray-900">Order Details</h2>
                  <p className="text-xs font-mono text-gray-400">Order ID: {selectedOrder.id}</p>
               </div>
               <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-white rounded-full transition-colors text-gray-400">
                 <X className="w-6 h-6" />
               </button>
             </div>

             <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8">
                {/* Status Section */}
                <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                   <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-xl ${getStatusColor(selectedOrder.status)}`}>
                        {getStatusIcon(selectedOrder.status)}
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Current Status</p>
                        <p className="font-bold text-gray-900 capitalize">{selectedOrder.status}</p>
                      </div>
                   </div>
                   <div className="flex items-center space-x-2">
                     <span className="text-xs font-bold text-gray-500">Update to:</span>
                     <select 
                       value={selectedOrder.status}
                       onChange={(e) => handleUpdateStatus(selectedOrder.id, e.target.value)}
                       className="text-xs font-bold border-none rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 bg-white shadow-sm"
                     >
                       <option value="pending">Pending</option>
                       <option value="processing">Processing</option>
                       <option value="shipped">Shipped</option>
                       <option value="delivered">Delivered</option>
                       <option value="cancelled">Cancelled</option>
                     </select>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   {/* Customer Info */}
                   <div className="space-y-4">
                      <h3 className="text-sm font-black text-gray-900 uppercase tracking-tighter flex items-center">
                        <User className="w-4 h-4 mr-2 text-indigo-500" />
                        Customer Info
                      </h3>
                      <div className="space-y-3 bg-white p-4 rounded-2xl border border-gray-50 shadow-sm">
                         <div className="flex items-start space-x-3">
                            <Mail className="w-4 h-4 text-gray-400 mt-0.5" />
                            <div>
                               <p className="text-[10px] font-bold text-gray-400 uppercase">Email</p>
                               <p className="text-sm font-bold text-gray-900">{users[selectedOrder.userId]?.email || 'N/A'}</p>
                            </div>
                         </div>
                         <div className="flex items-start space-x-3">
                            <Phone className="w-4 h-4 text-gray-400 mt-0.5" />
                            <div>
                               <p className="text-[10px] font-bold text-gray-400 uppercase">Phone</p>
                               <p className="text-sm font-bold text-gray-900">{selectedOrder.address?.contactNumber || 'N/A'}</p>
                            </div>
                         </div>
                         <div className="flex items-start space-x-3">
                            <Hash className="w-4 h-4 text-gray-400 mt-0.5" />
                            <div>
                               <p className="text-[10px] font-bold text-gray-400 uppercase">User ID</p>
                               <p className="text-xs font-mono text-gray-500 break-all">{selectedOrder.userId}</p>
                            </div>
                         </div>
                      </div>
                   </div>

                   {/* Shipping Address */}
                   <div className="space-y-4">
                      <h3 className="text-sm font-black text-gray-900 uppercase tracking-tighter flex items-center">
                        <MapPin className="w-4 h-4 mr-2 text-indigo-500" />
                        Shipping Address
                      </h3>
                      <div className="bg-white p-4 rounded-2xl border border-gray-50 shadow-sm text-sm space-y-1">
                         <p className="font-bold text-gray-900">{selectedOrder.address?.name}</p>
                         <p className="text-gray-600">{selectedOrder.address?.street}</p>
                         <p className="text-gray-600">{selectedOrder.address?.city}, {selectedOrder.address?.state}</p>
                         <p className="text-gray-600">{selectedOrder.address?.zip}</p>
                      </div>
                   </div>
                </div>

                {/* Items Section */}
                <div className="space-y-4">
                   <h3 className="text-sm font-black text-gray-900 uppercase tracking-tighter flex items-center">
                      <Package className="w-4 h-4 mr-2 text-indigo-500" />
                      Order Items
                   </h3>
                   <div className="bg-white rounded-2xl border border-gray-50 shadow-sm overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-50">
                        <thead className="bg-gray-50/30">
                           <tr>
                              <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-400 uppercase">Product</th>
                              <th className="px-4 py-3 text-center text-[10px] font-bold text-gray-400 uppercase">Qty</th>
                              <th className="px-4 py-3 text-right text-[10px] font-bold text-gray-400 uppercase">Price</th>
                              <th className="px-4 py-3 text-right text-[10px] font-bold text-gray-400 uppercase">Total</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                           {selectedOrder.items?.map((item: any, idx: number) => {
                             const product = products[item.productId];
                             return (
                               <tr key={idx}>
                                  <td className="px-4 py-3">
                                     <div className="flex items-center">
                                        {product?.images?.[0] && (
                                          <img src={product.images[0]} alt="" className="w-8 h-8 rounded-lg object-cover mr-3 border border-gray-50" />
                                        )}
                                        <div>
                                           <div className="text-xs font-bold text-gray-900 line-clamp-1">{product?.title || 'Unknown Product'}</div>
                                           <div className="text-[10px] text-gray-400 font-mono">#{item.productId.slice(0, 6)}</div>
                                        </div>
                                     </div>
                                  </td>
                                  <td className="px-4 py-3 text-center text-xs font-bold text-gray-700">x{item.quantity}</td>
                                  <td className="px-4 py-3 text-right text-xs text-gray-500 font-medium">₹{item.priceAtPurchase?.toLocaleString()}</td>
                                  <td className="px-4 py-3 text-right text-xs font-bold text-gray-900">₹{(item.priceAtPurchase * item.quantity).toLocaleString()}</td>
                                </tr>
                             );
                           })}
                        </tbody>
                        <tfoot className="bg-gray-50/30 font-bold">
                           <tr>
                              <td colSpan={3} className="px-4 py-4 text-right text-xs uppercase text-gray-500 tracking-wider">Net Total</td>
                              <td className="px-4 py-4 text-right text-lg text-indigo-600">₹{selectedOrder.totalAmount?.toLocaleString()}</td>
                           </tr>
                        </tfoot>
                      </table>
                   </div>
                </div>

                {/* Payment Info */}
                <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 flex justify-between items-center">
                   <div>
                      <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Payment Info</p>
                      <p className="font-bold text-indigo-900 capitalize">{selectedOrder.paymentMethod} • ID: {selectedOrder.paymentId?.slice(0, 12)}...</p>
                   </div>
                   <div className="text-right">
                      <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Transaction Date</p>
                      <p className="font-bold text-indigo-900">{selectedOrder.createdAt?.toDate ? selectedOrder.createdAt.toDate().toLocaleString() : 'N/A'}</p>
                   </div>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}

