import { useEffect, useState } from 'react';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { auth, db, handleFirestoreError, OperationType } from './firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

// Pages
import Layout from './components/Layout';
import Home from './pages/user/Home';
import ProductDetail from './pages/user/ProductDetail';
import Cart from './pages/user/Cart';
import Checkout from './pages/user/Checkout';
import Profile from './pages/user/Profile';
import OrderTracking from './pages/user/OrderTracking';
import Wishlist from './pages/user/Wishlist';

// Admin Pages
import AdminLayout from './components/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import ProductsManager from './pages/admin/ProductsManager';
import CategoriesManager from './pages/admin/CategoriesManager';
import SubcategoriesManager from './pages/admin/SubcategoriesManager';
import OrdersManager from './pages/admin/OrdersManager';
import UsersManager from './pages/admin/UsersManager';
import Reports from './pages/admin/Reports';
import Settings from './pages/admin/Settings';

import Login from './pages/Login';

export type UserRole = 'customer' | 'admin';

export interface AppUser {
  uid: string;
  email: string | null;
  role: UserRole;
  createdAt: any;
}

export default function App() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            if (firebaseUser.email === 'irshadvayad01@gmail.com' && userData.role !== 'admin') {
                await setDoc(userDocRef, { role: 'admin' }, { merge: true });
                userData.role = 'admin';
            }
            setUser({ uid: firebaseUser.uid, email: firebaseUser.email, ...userData } as AppUser);
          } else {
             const newUser = {
               email: firebaseUser.email,
               createdAt: serverTimestamp(),
               role: firebaseUser.email === 'irshadvayad01@gmail.com' ? 'admin' : 'customer' as UserRole
             };
             await setDoc(userDocRef, newUser);
             setUser({ uid: firebaseUser.uid, email: firebaseUser.email, role: newUser.role, createdAt: new Date() } as AppUser);
          }
        } catch (error) {
          console.error("Error fetching user data", error);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
           <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
           <p className="mt-4 font-medium text-gray-500">Loading your store...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
      
      {/* Customer Routes */}
      <Route element={<Layout user={user} />}>
        <Route path="/" element={<Home />} />
        <Route path="/product/:id" element={<ProductDetail user={user} />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={user ? <Checkout user={user} /> : <Navigate to="/login" />} />
        <Route path="/profile" element={user ? <Profile user={user} /> : <Navigate to="/login" />} />
        <Route path="/orders" element={user ? <OrderTracking user={user} /> : <Navigate to="/login" />} />
        <Route path="/wishlist" element={user ? <Wishlist user={user} /> : <Navigate to="/login" />} />
      </Route>

      {/* Admin Routes */}
      <Route path="/admin" element={user?.role === 'admin' ? <AdminLayout user={user} /> : <Navigate to="/" />}>
        <Route index element={<Dashboard />} />
        <Route path="categories" element={<CategoriesManager />} />
        <Route path="subcategories" element={<SubcategoriesManager />} />
        <Route path="products" element={<ProductsManager />} />
        <Route path="orders" element={<OrdersManager />} />
        <Route path="users" element={<UsersManager />} />
        <Route path="reports" element={<Reports />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}
