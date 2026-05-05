import { useEffect, useState } from 'react';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../firebase';
import { Link } from 'react-router-dom';
import { Star, Filter, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

export default function Home() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [subCategoryFilter, setSubCategoryFilter] = useState<string>('');
  
  const [categories, setCategories] = useState<any[]>([]);
  const [subCategories, setSubCategories] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodSnap, catSnap, subCatSnap] = await Promise.all([
          getDocs(query(collection(db, 'products'), orderBy('createdAt', 'desc'))),
          getDocs(query(collection(db, 'categories'), orderBy('name', 'asc'))),
          getDocs(query(collection(db, 'subcategories'), orderBy('name', 'asc')))
        ]);

        const productsData = prodSnap.docs.map(doc => ({
          id: doc.id,
          ...(doc.data() as object)
        })) as any[];
        
        setProducts(productsData);
        setCategories(catSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        setSubCategories(subCatSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'products/categories');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const availableSubcategories = subCategories.filter(sc => sc.categoryId === categoryFilter);

  const filteredProducts = products.filter(p => {
    let match = true;
    if (categoryFilter && p.category !== categoryFilter) match = false;
    if (subCategoryFilter && p.subCategory !== subCategoryFilter) match = false;
    return match;
  });

  const getCategoryName = (id: string) => categories.find(c => c.id === id)?.name || id;
  const getSubCategoryName = (id: string) => subCategories.find(s => s.id === id)?.name || id;

  if (loading) {
    return <div className="py-20 text-center">Loading products...</div>;
  }

  return (
    <div className="space-y-16 py-4">
      {/* Hero Section */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-indigo-900 text-white rounded-[2.5rem] overflow-hidden relative min-h-[50vh] flex items-center shadow-2xl shadow-indigo-900/20"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent z-10" />
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center mix-blend-overlay opacity-40"></div>
        
        <div className="relative z-20 p-10 md:p-20 w-full md:max-w-2xl">
          <motion.h1 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-[1.1] font-display"
          >
            Curated for <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-200 to-white">Your Lifestyle</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-lg md:text-xl text-indigo-100 font-normal mb-8 max-w-lg leading-relaxed"
          >
            Discover exceptional products that elevate your everyday experience, crafted with uncompromising quality.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <a href="#products" className="inline-flex items-center justify-center bg-white text-indigo-900 px-8 py-4 rounded-2xl font-bold hover:bg-indigo-50 hover:scale-105 active:scale-95 transition-all shadow-lg group">
              Shop the Collection
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </a>
          </motion.div>
        </div>
      </motion.section>

      {/* Filter and Products */}
      <section id="products" className="space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-center bg-white/70 backdrop-blur-md p-4 rounded-3xl border border-gray-100 shadow-sm sticky top-20 z-30">
          <h2 className="text-2xl font-bold tracking-tight mb-4 sm:mb-0 px-4 font-display">New Arrivals</h2>
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-gray-500" />
            <select 
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setSubCategoryFilter(''); }}
              className="bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-gray-900 focus:border-gray-900 block w-full p-2.5 outline-none"
            >
              <option value="">All Categories</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            {categoryFilter && availableSubcategories.length > 0 && (
              <select 
                value={subCategoryFilter}
                onChange={(e) => setSubCategoryFilter(e.target.value)}
                className="bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-gray-900 focus:border-gray-900 block w-full p-2.5 outline-none"
              >
                <option value="">All Subcategories</option>
                {availableSubcategories.map(sc => (
                  <option key={sc.id} value={sc.id}>{sc.name}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="text-center py-20 text-gray-500 bg-white rounded-2xl border border-gray-100">
            No products found matching your filters.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredProducts.map((product, index) => (
              <motion.div 
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="h-full"
              >
                <Link to={`/product/${product.id}`} className="group bg-white rounded-[2rem] p-4 flex flex-col h-full hover:-translate-y-2 transition-all duration-300">
                  <div className="aspect-[4/5] bg-gray-100 rounded-3xl overflow-hidden mb-5 relative">
                    {product.images?.[0] ? (
                      <img 
                        src={product.images[0]} 
                        alt={product.title} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">No image</div>
                    )}
                    <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors duration-500" />
                    {product.inventory === 0 && (
                      <div className="absolute top-4 right-4 bg-red-500/90 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider shadow-lg">
                        Sold out
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 flex flex-col px-2">
                    {product.category && (
                      <span className="text-[11px] font-bold text-indigo-500 uppercase tracking-widest mb-2 block">
                        {getCategoryName(product.category)} {product.subCategory && `• ${getSubCategoryName(product.subCategory)}`}
                      </span>
                    )}
                    <h3 className="font-bold text-gray-900 text-lg leading-snug line-clamp-2 mb-3 group-hover:text-indigo-600 transition-colors shrink-0">
                      {product.title}
                    </h3>
                    
                    <div className="mt-auto flex flex-col pt-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-baseline space-x-2">
                          <span className="font-extrabold text-xl text-gray-900">₹{product.price.toLocaleString()}</span>
                          {product.originalPrice > product.price && (
                             <span className="text-sm font-medium text-gray-400 line-through">₹{product.originalPrice.toLocaleString()}</span>
                          )}
                        </div>
                        
                        {product.rating > 0 && (
                          <div className="flex items-center text-sm font-semibold text-gray-700">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 mr-1.5" />
                            {product.rating.toFixed(1)}
                          </div>
                        )}
                      </div>
                      {product.originalPrice > product.price && (
                        <div className="mt-1">
                          <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded uppercase tracking-wider">
                            {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
