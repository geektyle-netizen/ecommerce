import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, orderBy, getDocs, setDoc, serverTimestamp, runTransaction, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, auth } from '../../firebase';
import { AppUser } from '../../App';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { Star, ShoppingCart, Heart, Image as ImageIcon } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function ProductDetail({ user }: { user: AppUser | null }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [subCategories, setSubCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mainImage, setMainImage] = useState<string>('');
  const { addToCart } = useCart();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  
  // Review form
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewImages, setReviewImages] = useState<string[]>([]);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [hasPurchased, setHasPurchased] = useState(false);

  useEffect(() => {
    const fetchPurchaseStatus = async () => {
      if (!user) return;
      if (!id) return;
      try {
        const q = query(
          collection(db, 'orders'),
          where('userId', '==', user.uid)
        );
        const snaps = await getDocs(q);
        const purchased = snaps.docs.some(doc => {
          const items = doc.data().items || [];
          return items.some((item: any) => item.productId === id) && doc.data().status === 'delivered';
        });
        setHasPurchased(purchased);
      } catch (error) {
        console.error("Error fetching purchases", error);
      }
    };
    fetchPurchaseStatus();
  }, [user, id]);

  useEffect(() => {
    const fetchProductAndData = async () => {
      if (!id) return;
      try {
        const [docSnap, catSnap, subCatSnap, reviewsSnap] = await Promise.all([
          getDoc(doc(db, 'products', id)),
          getDocs(query(collection(db, 'categories'))),
          getDocs(query(collection(db, 'subcategories'))),
          getDocs(query(collection(db, `products/${id}/reviews`), orderBy('createdAt', 'desc')))
        ]);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          setProduct({ id: docSnap.id, ...data });
          if (data.images && data.images.length > 0) {
            setMainImage(data.images[0]);
          }

          setCategories(catSnap.docs.map(d => ({ id: d.id, ...d.data() })));
          setSubCategories(subCatSnap.docs.map(d => ({ id: d.id, ...d.data() })));
          
          setReviews(reviewsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        } else {
          navigate('/');
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `products/${id}`);
      } finally {
        setLoading(false);
      }
    };

    fetchProductAndData();
  }, [id, navigate]);

  const handleAddToCart = () => {
    if (!product) return;
    addToCart({
      productId: product.id,
      quantity: 1,
      price: product.price,
      title: product.title,
      image: product.images?.[0]
    });
  };

  const handleWishlist = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!id) return;
    
    if (isInWishlist(id)) {
      removeFromWishlist(id);
    } else {
      addToWishlist(id);
    }
  };

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !id) return;

    setSubmittingReview(true);
    try {
      // In a real transactional system, we would calculate running average. Let's do it via transaction
      const reviewId = doc(collection(db, `products/${id}/reviews`)).id;
      
      await runTransaction(db, async (transaction) => {
         const productRef = doc(db, 'products', id);
         const productDoc = await transaction.get(productRef);
         if (!productDoc.exists()) throw new Error("Product does not exist");
         
         const newRating = reviewRating;
         const currentRating = productDoc.data().rating || 0;
         const currentCount = productDoc.data().reviewCount || 0;
         
         const newAverage = ((currentRating * currentCount) + newRating) / (currentCount + 1);
         
         // In rules, we need existsAfter. The review is created, and product is updated.
         const reviewRef = doc(db, `products/${id}/reviews`, reviewId);
         transaction.set(reviewRef, {
           userId: user.uid,
           userName: user.email?.split('@')[0] || 'User',
           rating: newRating,
           text: reviewText,
           images: reviewImages,
           createdAt: serverTimestamp()
         });

         transaction.update(productRef, {
           rating: newAverage,
           reviewCount: currentCount + 1,
           updatedAt: serverTimestamp()
         });
      });

      // Optimistic update locally
      setReviews([{
        id: reviewId,
        userId: user.uid,
        userName: user.email?.split('@')[0] || 'User',
        rating: reviewRating,
        text: reviewText,
        images: reviewImages,
        createdAt: new Date()
      }, ...reviews]);
      
      setProduct({
        ...product,
        rating: ((product.rating * product.reviewCount) + reviewRating) / (product.reviewCount + 1),
        reviewCount: product.reviewCount + 1
      });

      setReviewText('');
      setReviewRating(5);
      setReviewImages([]);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `products/${id}/reviews`);
    } finally {
      setSubmittingReview(false);
    }
  };


  const getCategoryName = (cid: string) => categories.find(c => c.id === cid)?.name || cid;
  const getSubCategoryName = (sid: string) => subCategories.find(s => s.id === sid)?.name || sid;

  const handleReviewImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    if (reviewImages.length + files.length > 5) {
      alert(`Maximum 5 images allowed. You can only add ${5 - reviewImages.length} more.`);
      return;
    }

    const processImage = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 800;
            const MAX_HEIGHT = 800;
            let width = img.width;
            let height = img.height;

            if (width > height) {
              if (width > MAX_WIDTH) {
                height *= MAX_WIDTH / width;
                width = MAX_WIDTH;
              }
            } else {
              if (height > MAX_HEIGHT) {
                width *= MAX_HEIGHT / height;
                height = MAX_HEIGHT;
              }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, width, height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
            
            if (dataUrl.length > 500000) {
               reject(new Error('Image is too large after compression.'));
               return;
            }
            resolve(dataUrl);
          };
          img.onerror = () => reject(new Error('Failed to load image.'));
          if (event.target?.result) {
            img.src = event.target.result as string;
          }
        };
        reader.onerror = () => reject(new Error('Failed to read file.'));
        reader.readAsDataURL(file);
      });
    };

    try {
      setSubmittingReview(true); // Reusing as loading state for images
      const processedImages = await Promise.all(
        files.map(file => processImage(file).catch(err => {
          alert(err.message);
          return null;
        }))
      );

      const validImages = processedImages.filter(Boolean) as string[];
      
      setReviewImages(prev => [...prev, ...validImages]);
    } catch (error) {
      console.error(error);
    } finally {
      setSubmittingReview(false);
    }
    
    if (e.target) {
      e.target.value = '';
    }
  };

  const removeReviewImage = (index: number) => {
    setReviewImages(prev => prev.filter((_, i) => i !== index));
  };

  if (loading) return <div className="py-20 text-center">Loading product...</div>;
  if (!product) return <div className="py-20 text-center">Product not found</div>;

  return (
    <div className="space-y-12">
      <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
        {/* Images */}
        <div className="space-y-4">
          <div className="aspect-square bg-gray-50 rounded-2xl overflow-hidden shadow-sm border border-gray-100 flex items-center justify-center relative">
            {mainImage ? (
              <img src={mainImage} alt={product.title} className="w-full h-full object-contain" />
            ) : (
              <ImageIcon className="w-12 h-12 text-gray-300" />
            )}
            {product.inventory === 0 && (
                 <div className="absolute top-4 right-4 bg-red-500 text-white text-sm font-bold px-3 py-1.5 rounded-lg uppercase tracking-wider shadow-lg">
                   Sold out
                 </div>
            )}
          </div>
          {product.images && product.images.length > 1 && (
            <div className="flex space-x-4 overflow-x-auto pb-2">
              {product.images.map((img: string, idx: number) => (
                <button 
                  key={idx} 
                  onClick={() => setMainImage(img)}
                  className={`flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${mainImage === img ? 'border-gray-900 opacity-100' : 'border-transparent opacity-60 hover:opacity-100'}`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex flex-col h-full">
          <div className="mb-2 flex items-center space-x-2">
             <span className="text-xs font-bold uppercase tracking-wider text-gray-500 bg-gray-100 px-2.5 py-1 rounded-md">
               {getCategoryName(product.category)} {product.subCategory && `• ${getSubCategoryName(product.subCategory)}`}
             </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 mb-4 leading-tight">{product.title}</h1>
          
          <div className="flex items-center space-x-4 mb-6">
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-light text-gray-900">₹{product.price.toLocaleString()}</span>
              {product.originalPrice > product.price && (
                <>
                  <span className="text-xl font-medium text-gray-400 line-through">₹{product.originalPrice.toLocaleString()}</span>
                  <span className="text-sm font-bold text-green-600 bg-green-50 px-2.5 py-1 rounded-md">
                    {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
                  </span>
                </>
              )}
            </div>
            {product.rating > 0 && (
              <div className="flex items-center text-sm font-medium text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg">
                <Star className="w-4 h-4 fill-amber-500 text-amber-500 mr-1.5" />
                {product.rating.toFixed(1)} <span className="text-amber-800 ml-1 opacity-60">({product.reviewCount} reviews)</span>
              </div>
            )}
          </div>

          <div className="prose prose-gray prose-sm mb-8 text-gray-600 max-w-none prose-p:leading-relaxed">
            <ReactMarkdown>{product.description}</ReactMarkdown>
          </div>

          <div className="mt-auto space-y-4 pt-8 border-t border-gray-100">
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
              <button
                onClick={handleAddToCart}
                disabled={product.inventory === 0}
                className="flex-1 flex items-center justify-center space-x-2 bg-gray-900 text-white px-8 py-4 rounded-2xl font-semibold text-lg hover:bg-gray-800 focus:ring-4 focus:ring-gray-200 focus:outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ShoppingCart className="w-5 h-5" />
                <span>{product.inventory === 0 ? 'Out of Stock' : 'Add to Cart'}</span>
              </button>
              <button
                onClick={handleWishlist}
                className={`flex items-center justify-center p-4 rounded-2xl border transition-colors ${isInWishlist(id!) ? 'bg-red-50 border-red-100 text-red-500 hover:bg-red-100' : 'bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-900'}`}
                title={isInWishlist(id!) ? "Remove from Wishlist" : "Save to Wishlist"}
              >
                <Heart className="w-6 h-6" fill={isInWishlist(id!) ? "currentColor" : "none"} />
              </button>
            </div>
            <p className="text-sm text-center text-gray-500">
              {product.inventory > 0 && product.inventory < 10 && (
                <span className="text-orange-600 font-medium pb-2 block">Only {product.inventory} items left in stock</span>
              )}
              Free shipping on orders over ₹5,000. Secure checkout.
            </p>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
        <h2 className="text-2xl font-bold tracking-tight mb-8">Customer Reviews</h2>
        
        {user ? hasPurchased ? (
          <div className="mb-10 bg-gray-50 rounded-2xl p-6 border border-gray-100">
            <h3 className="text-lg font-semibold mb-4">Write a review</h3>
            <form onSubmit={submitReview} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                <div className="flex space-x-2 border border-gray-200 bg-white inline-flex p-1 rounded-xl">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className="p-1 focus:outline-none"
                    >
                      <Star className={`w-6 h-6 transition-colors ${reviewRating >= star ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Your review</label>
                <textarea
                  required
                  rows={3}
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-gray-900 focus:border-gray-900 outline-none resize-none font-sans"
                  placeholder="What did you think about this product?"
                />
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <label className="cursor-pointer bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium py-2 px-4 rounded-xl transition-colors inline-flex items-center text-sm">
                     <ImageIcon className="w-4 h-4 mr-2" />
                     Add Photos
                     <input 
                        type="file" 
                        accept="image/*" 
                        multiple
                        className="hidden" 
                        onChange={handleReviewImageUpload}
                        disabled={submittingReview}
                     />
                  </label>
                  <span className="text-xs text-gray-500">{reviewImages.length}/5 images</span>
                </div>

                {reviewImages.length > 0 && (
                  <div className="flex gap-4 overflow-x-auto py-2">
                    {reviewImages.map((img, index) => (
                      <div key={index} className="relative flex-shrink-0">
                        <img 
                          src={img} 
                          alt={`Review upload ${index + 1}`} 
                          className="w-20 h-20 object-cover rounded-xl border border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={() => removeReviewImage(index)}
                          className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-md border border-gray-100 text-gray-500 hover:text-red-500 transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button 
                type="submit" 
                disabled={submittingReview || !reviewText.trim()}
                className="px-6 py-2.5 bg-gray-900 text-white rounded-xl font-medium text-sm hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                {submittingReview ? 'Submitting...' : 'Submit Review'}
              </button>
            </form>
          </div>
        ) : (
          <div className="mb-10 bg-gray-50 rounded-2xl p-6 border border-gray-100 text-center">
            <p className="text-gray-600">You must purchase this product to leave a review.</p>
          </div>
        ) : (
          <div className="mb-10 bg-gray-50 rounded-2xl p-6 border border-gray-100 text-center">
            <p className="text-gray-600 mb-4">Please log in to leave a review</p>
            <button onClick={() => navigate('/login')} className="px-6 py-2 bg-white border border-gray-200 rounded-xl font-medium text-gray-900 hover:bg-gray-50 transition-colors">
              Log In
            </button>
          </div>
        )}

        <div className="space-y-6">
          {reviews.length === 0 ? (
            <p className="text-gray-500 italic py-4 text-center">No reviews yet. Be the first to review this product!</p>
          ) : (
            reviews.map((review) => (
              <div key={review.id} className="border-b border-gray-100 pb-6 last:border-0 last:pb-0">
                <div className="flex justify-between items-start mb-2">
                  <div className="font-medium text-gray-900">{review.userName}</div>
                  <div className="text-sm text-gray-500">
                    {review.createdAt ? (review.createdAt.toDate ? review.createdAt.toDate().toLocaleDateString() : 'Just now') : 'Just now'}
                  </div>
                </div>
                <div className="flex space-x-1 mb-3">
                  {[1, 2, 3, 4, 5].map(star => (
                    <Star key={star} className={`w-4 h-4 ${review.rating >= star ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />
                  ))}
                </div>
                <p className="text-gray-700 leading-relaxed text-sm mb-3">{review.text}</p>
                {review.images && review.images.length > 0 && (
                  <div className="flex gap-3 overflow-x-auto">
                    {review.images.map((img: string, idx: number) => (
                      <img 
                        key={idx} 
                        src={img} 
                        alt={`Review attached photo ${idx + 1}`} 
                        className="w-20 h-20 object-cover rounded-xl border border-gray-100" 
                      />
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
