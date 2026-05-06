import { useState, useEffect } from 'react';
import { collection, query, getDocs, doc, deleteDoc, orderBy, collectionGroup, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../firebase';
import { Star, Trash2, Filter, Package, User, Calendar, MessageSquare, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ReviewsManager() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [productFilter, setProductFilter] = useState<string>('');
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const prodSnap = await getDocs(query(collection(db, 'products'), orderBy('title', 'asc')));
      const prods = prodSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setProducts(prods);
      
      await fetchReviews();
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'products');
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const reviewsQuery = collectionGroup(db, 'reviews');
      const snapshot = await getDocs(reviewsQuery);
      
      const reviewsData = snapshot.docs.map(doc => {
        const pathParts = doc.ref.path.split('/');
        const productId = pathParts[1]; // products/{productId}/reviews/{reviewId}
        return {
          id: doc.id,
          productId,
          ...doc.data()
        };
      });

      // Manual sort since collectionGroup might not play nice with orderby without index
      reviewsData.sort((a: any, b: any) => {
        const timeA = a.createdAt?.toMillis?.() || 0;
        const timeB = b.createdAt?.toMillis?.() || 0;
        return timeB - timeA;
      });

      setReviews(reviewsData);
    } catch (error) {
      console.error("Collection group error:", error);
      // If collection group fails (usually due to missing index/rules), we might need an alternative
      // But we will fix the rules.
      toast.error("Failed to load reviews. Indices might be building.");
    }
  };

  const handleDeleteReview = async (review: any) => {
    if (!confirm("Are you sure you want to delete this review? This action cannot be undone.")) return;
    
    setDeleting(review.id);
    try {
      const reviewRef = doc(db, `products/${review.productId}/reviews`, review.id);
      await deleteDoc(reviewRef);
      toast.success("Review deleted successfully");
      setReviews(prev => prev.filter(r => r.id !== review.id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `products/${review.productId}/reviews/${review.id}`);
    } finally {
      setDeleting(null);
    }
  };

  const filteredReviews = productFilter 
    ? reviews.filter(r => r.productId === productFilter)
    : reviews;

  const getProductTitle = (id: string) => {
    return products.find(p => p.id === id)?.title || id;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Manage Reviews</h1>
        
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-gray-400" />
          <select 
            value={productFilter}
            onChange={(e) => setProductFilter(e.target.value)}
            className="flex-1 sm:w-64 bg-white border border-gray-100 text-sm font-bold rounded-xl px-4 py-2 shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            <option value="">All Products</option>
            {products.map(p => (
              <option key={p.id} value={p.id}>{p.title}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-gray-100">
           <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4"></div>
           <p className="text-gray-500">Loading reviews...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReviews.length === 0 ? (
            <div className="p-20 text-center text-gray-500 bg-white rounded-3xl border border-gray-100">
              <MessageSquare className="w-12 h-12 text-gray-200 mx-auto mb-4" />
              <p>No reviews found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredReviews.map((review) => (
                <div key={review.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex flex-col md:flex-row justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center justify-between">
                         <div className="flex items-center space-x-2">
                            <span className="flex items-center bg-yellow-50 text-yellow-700 px-2 py-1 rounded-lg text-xs font-bold">
                               <Star className="w-3 h-3 fill-yellow-400 text-yellow-400 mr-1" />
                               {review.rating}
                            </span>
                            <span className="text-gray-300">•</span>
                            <span className="flex items-center text-xs font-bold text-gray-500 truncate max-w-[200px]">
                               <Package className="w-3 h-3 mr-1" />
                               {getProductTitle(review.productId)}
                            </span>
                         </div>
                         <div className="md:hidden">
                            <button 
                              onClick={() => handleDeleteReview(review)}
                              disabled={deleting === review.id}
                              className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-xl transition-all"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                         </div>
                      </div>

                      <div className="flex items-center space-x-3">
                         <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
                            <User className="w-4 h-4" />
                         </div>
                         <div>
                            <p className="text-sm font-bold text-gray-900">{review.userName || 'Anonymous'}</p>
                            <div className="flex items-center text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                               <Calendar className="w-3 h-3 mr-1" />
                               {review.createdAt?.toDate ? review.createdAt.toDate().toLocaleDateString() : 'N/A'}
                            </div>
                         </div>
                      </div>

                      <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">{review.text || 'No comment provided.'}</p>
                      
                      {review.images && review.images.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-2">
                           {review.images.map((img: string, i: number) => (
                             <img key={i} src={img} alt="Review" className="w-16 h-16 rounded-xl object-cover border border-gray-100" />
                           ))}
                        </div>
                      )}
                    </div>

                    <div className="hidden md:flex items-start">
                       <button 
                         onClick={() => handleDeleteReview(review)}
                         disabled={deleting === review.id}
                         className="flex items-center text-red-500 hover:bg-red-50 px-4 py-2 rounded-2xl text-sm font-bold transition-all border border-red-50 hover:border-red-100"
                       >
                         {deleting === review.id ? 'Deleting...' : (
                           <>
                             <Trash2 className="w-4 h-4 mr-2" />
                             Delete Review
                           </>
                         )}
                       </button>
                    </div>
                  </div>
                  {review.text && review.text.length > 500 && (
                    <div className="mt-4 flex items-center bg-red-50 text-red-700 p-3 rounded-xl text-xs font-medium">
                       <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                       Long comment detected. Consider reviewing for spam.
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
