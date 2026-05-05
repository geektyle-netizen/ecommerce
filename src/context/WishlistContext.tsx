import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { doc, getDoc, setDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import toast from 'react-hot-toast';

interface WishlistContextType {
  productIds: string[];
  addToWishlist: (productId: string) => void;
  removeFromWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [productIds, setProductIds] = useState<string[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setUserId(user ? user.uid : null);
    });
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!userId) {
      setProductIds([]);
      return;
    }

    const unsub = onSnapshot(doc(db, 'wishlists', userId), (docSnap) => {
      if (docSnap.exists() && docSnap.data().productIds) {
        setProductIds(docSnap.data().productIds);
      } else {
        setProductIds([]);
      }
    }, (error) => {
      console.error(error);
    });

    return () => unsub();
  }, [userId]);

  const addToWishlist = async (productId: string) => {
    if (!userId) {
      toast.error('Please log in to add to wishlist');
      return;
    }
    const newIds = [...new Set([...productIds, productId])];
    setProductIds(newIds); // Optimistic UI update
    toast.success('Added to wishlist', {
      icon: '💚',
      style: {
        borderRadius: '10px',
        background: '#ecfdf5',
        color: '#064e3b',
      },
    });
    try {
      await setDoc(doc(db, 'wishlists', userId), {
        productIds: newIds,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      setProductIds(productIds); // Revert optimistic changes
      handleFirestoreError(error, OperationType.UPDATE, `wishlists/${userId}`);
    }
  };

  const removeFromWishlist = async (productId: string) => {
    if (!userId) return;
    const newIds = productIds.filter(id => id !== productId);
    setProductIds(newIds);
    toast.success('Removed from wishlist');
    try {
      await setDoc(doc(db, 'wishlists', userId), {
        productIds: newIds,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (error) {
       setProductIds(productIds);
       handleFirestoreError(error, OperationType.UPDATE, `wishlists/${userId}`);
    }
  };

  const isInWishlist = (productId: string) => {
    return productIds.includes(productId);
  };

  return (
    <WishlistContext.Provider value={{ productIds, addToWishlist, removeFromWishlist, isInWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}
