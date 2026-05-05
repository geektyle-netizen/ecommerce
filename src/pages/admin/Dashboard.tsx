import { useState, useEffect } from 'react';
import { collection, query, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../firebase';
import { DollarSign, Package, ShoppingBag, Users } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalSales: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalUsers: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [ordersSnap, productsSnap, usersSnap] = await Promise.all([
          getDocs(query(collection(db, 'orders'))),
          getDocs(query(collection(db, 'products'))),
          getDocs(query(collection(db, 'users')))
        ]);

        let sales = 0;
        ordersSnap.docs.forEach(doc => {
           if (doc.data().status !== 'cancelled') {
              sales += doc.data().totalAmount || 0;
           }
        });

        setStats({
          totalSales: sales,
          totalOrders: ordersSnap.size,
          totalProducts: productsSnap.size,
          totalUsers: usersSnap.size
        });
      } catch (error) {
         handleFirestoreError(error, OperationType.LIST, 'multiple');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div className="text-center py-20">Loading dashboard...</div>;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Dashboard Overview</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center">
          <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center mr-4">
             <DollarSign className="w-7 h-7 text-green-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Total Sales</p>
            <h3 className="text-2xl font-bold text-gray-900">₹{stats.totalSales.toLocaleString()}</h3>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center">
          <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mr-4">
             <ShoppingBag className="w-7 h-7 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Total Orders</p>
            <h3 className="text-2xl font-bold text-gray-900">{stats.totalOrders}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center">
          <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center mr-4">
             <Package className="w-7 h-7 text-purple-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Products</p>
            <h3 className="text-2xl font-bold text-gray-900">{stats.totalProducts}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center">
          <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center mr-4">
             <Users className="w-7 h-7 text-orange-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Customers</p>
            <h3 className="text-2xl font-bold text-gray-900">{stats.totalUsers}</h3>
          </div>
        </div>
      </div>

       <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
         <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
         <div className="flex gap-4">
           <a href="/admin/products" className="px-6 py-3 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-100 transition-colors">Add New Product</a>
           <a href="/admin/orders" className="px-6 py-3 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-100 transition-colors">View Pending Orders</a>
         </div>
       </div>
    </div>
  );
}
