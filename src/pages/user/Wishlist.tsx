import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../firebase';
import { AppUser } from '../../App';
import { Heart, Trash2, ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';

export default function Wishlist({ user }: { user: AppUser }) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      const wishlistRef = doc(db, 'wishlists', user.uid);
      const wishlistDoc = await getDoc(wishlistRef);
      
      if (!wishlistDoc.exists() || !wishlistDoc.data().productIds || wishlistDoc.data().productIds.length === 0) {
        setProducts([]);
        setLoading(false);
        return;
      }

      const productIds = wishlistDoc.data().productIds;
      const fetchedProducts = [];
      
      // Fetch each product (ideally use in query, but limited to 10 in firestore "in" query so loop is fine for small wishlists)
      for (const id of productIds) {
        if (!id) continue;
        const pDoc = await getDoc(doc(db, 'products', id));
        if (pDoc.exists()) {
          fetchedProducts.push({ id: pDoc.id, ...pDoc.data() });
        }
      }
      
      setProducts(fetchedProducts);
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `wishlists/${user.uid}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, [user.uid]);

  const handleRemove = async (productId: string) => {
    try {
      const newProductIds = products.filter(p => p.id !== productId).map(p => p.id);
      await setDoc(doc(db, 'wishlists', user.uid), {
        productIds: newProductIds,
        updatedAt: serverTimestamp()
      });
      // update local
      setProducts(products.filter(p => p.id !== productId));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `wishlists/${user.uid}`);
    }
  };

  const handleAddToCart = (product: any) => {
    addToCart({
      productId: product.id,
      quantity: 1,
      price: product.price,
      title: product.title,
      image: product.images?.[0]
    });
  };

  if (loading) {
    return <div className="text-center py-20">Loading wishlist...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold tracking-tight text-gray-900">My Wishlist</h1>

      {products.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6">
            <Heart className="w-10 h-10 text-red-400 fill-red-100" />
          </div>
          <h2 className="text-xl font-medium text-gray-900 mb-2">Your wishlist is empty</h2>
          <p className="text-gray-500 mb-6">Save items you love and buy them later.</p>
          <Link to="/" className="px-6 py-2.5 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors">
            Start Browsing
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map(product => (
            <div key={product.id} className="group relative bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex flex-col">
              <div className="aspect-square bg-gray-50 rounded-xl overflow-hidden mb-4 relative">
                {product.images?.[0] ? (
                  <img src={product.images[0]} alt={product.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">No image</div>
                )}
                <button 
                  onClick={() => handleRemove(product.id)}
                  className="absolute top-2 right-2 p-2 bg-white/80 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full backdrop-blur transition-all"
                  title="Remove from wishlist"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              
              <div className="flex-1 flex flex-col">
                <Link to={`/product/${product.id}`} className="font-semibold text-gray-900 tracking-tight leading-tight line-clamp-2 hover:text-blue-600 transition-colors mb-1">
                  {product.title}
                </Link>
                <div className="text-lg font-bold text-gray-900 mb-4">₹{product.price.toLocaleString()}</div>
                
                <button 
                  onClick={() => handleAddToCart(product)}
                  disabled={product.inventory === 0}
                  className="mt-auto w-full py-2.5 px-4 bg-gray-900 text-white rounded-xl font-medium flex items-center justify-center hover:bg-gray-800 transition-colors disabled:opacity-50"
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  {product.inventory === 0 ? 'Out of Stock' : 'Add to Cart'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
