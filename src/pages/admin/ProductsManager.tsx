import { useState, useEffect } from 'react';
import { collection, query, getDocs, doc, setDoc, deleteDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../firebase';
import { auth } from '../../firebase';
import { Plus, Edit2, Trash2, X, Image as ImageIcon, Upload } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProductsManager() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    originalPrice: 0,
    price: 0,
    category: '',
    subCategory: '',
    images: [] as string[],
    inventory: 0,
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [prodSnap, catSnap, subSnap] = await Promise.all([
        getDocs(query(collection(db, 'products'), orderBy('createdAt', 'desc'))),
        getDocs(query(collection(db, 'categories'), orderBy('name', 'asc'))),
        getDocs(query(collection(db, 'subcategories'), orderBy('name', 'asc')))
      ]);
      
      setProducts(prodSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setCategories(catSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setSubcategories(subSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (formData.images.length >= 5) {
      toast.error('Maximum 5 images allowed');
      return;
    }

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
        
        // Base64 size limit check (Firestore document limit is 1MB)
        if (dataUrl.length > 500000) {
           toast.error('Image is too large. Please select a smaller image.');
           return;
        }

        setFormData(prev => ({
          ...prev,
          images: [...prev.images, dataUrl]
        }));
      };
      if (event.target?.result) {
        img.src = event.target.result as string;
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    
    if (formData.price > formData.originalPrice && formData.originalPrice > 0) {
       toast.error("Offer price must be less than original price");
       return;
    }

    try {
      if (editingId) {
        const productRef = doc(db, 'products', editingId);
        await setDoc(productRef, {
          title: formData.title,
          description: formData.description,
          originalPrice: Number(formData.originalPrice),
          price: Number(formData.price),
          category: formData.category,
          subCategory: formData.subCategory,
          images: formData.images,
          inventory: Number(formData.inventory),
          updatedAt: serverTimestamp(),
        }, { merge: true });
        toast.success("Product updated");
      } else {
        const newId = crypto.randomUUID();
        const productRef = doc(db, 'products', newId);
        await setDoc(productRef, {
          title: formData.title,
          description: formData.description,
          originalPrice: Number(formData.originalPrice),
          price: Number(formData.price),
          category: formData.category,
          subCategory: formData.subCategory,
          images: formData.images,
          inventory: Number(formData.inventory),
          rating: 0,
          reviewCount: 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        toast.success("Product added");
      }
      setIsModalOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      handleFirestoreError(error, editingId ? OperationType.UPDATE : OperationType.CREATE, 'products');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await deleteDoc(doc(db, 'products', id));
        toast.success("Product deleted");
        fetchData();
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `products/${id}`);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      originalPrice: 0,
      price: 0,
      category: '',
      subCategory: '',
      images: [],
      inventory: 0,
    });
    setEditingId(null);
  };

  const openEdit = (product: any) => {
    setFormData({
      title: product.title,
      description: product.description,
      originalPrice: product.originalPrice || 0,
      price: product.price,
      category: product.category,
      subCategory: product.subCategory || '',
      images: product.images || [],
      inventory: product.inventory,
    });
    setEditingId(product.id);
    setIsModalOpen(true);
  };

  const removeImage = (index: number) => {
    setFormData({
      ...formData,
      images: formData.images.filter((_, i) => i !== index)
    });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manage Products</h1>
        <button
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="flex items-center px-4 py-2 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" /> Add Product
        </button>
      </div>

      {loading ? (
        <div className="text-center py-10">Loading products...</div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Inventory</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                        {product.images?.[0] ? (
                          <img src={product.images[0]} alt="" className="h-10 w-10 object-cover" />
                        ) : (
                          <ImageIcon className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 truncate max-w-[200px]">{product.title}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                       <span className="font-bold text-gray-900">₹{product.price.toLocaleString()}</span>
                       {product.originalPrice > product.price && (
                          <span className="ml-2 text-xs text-gray-500 line-through">₹{product.originalPrice.toLocaleString()}</span>
                       )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{product.inventory}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {categories.find(c => c.id === product.category)?.name || product.category || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => openEdit(product)} className="text-blue-600 hover:text-blue-900 mr-4">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(product.id)} className="text-red-600 hover:text-red-900">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">{editingId ? 'Edit Product' : 'Add New Product'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    required
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-gray-900 focus:border-gray-900 outline-none"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description (Markdown supported)</label>
                  <textarea
                    required
                    rows={4}
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-gray-900 focus:border-gray-900 outline-none resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Original Price (₹)</label>
                  <input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.originalPrice}
                    onChange={(e) => setFormData({...formData, originalPrice: e.target.value ? Number(e.target.value) : 0})}
                    className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-gray-900 focus:border-gray-900 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Offer Price (₹)</label>
                  <input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value ? Number(e.target.value) : 0})}
                    className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-gray-900 focus:border-gray-900 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Inventory</label>
                  <input
                    required
                    type="number"
                    min="0"
                    value={formData.inventory}
                    onChange={(e) => setFormData({...formData, inventory: e.target.value ? Number(e.target.value) : 0})}
                    className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-gray-900 focus:border-gray-900 outline-none"
                  />
                </div>
                
                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select
                      required
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value, subCategory: ''})}
                      className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2 focus:ring-gray-900 focus:border-gray-900 outline-none"
                    >
                      <option value="">Select Category</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Subcategory</label>
                    <select
                      value={formData.subCategory}
                      onChange={(e) => setFormData({...formData, subCategory: e.target.value})}
                      disabled={!formData.category}
                      className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2 focus:ring-gray-900 focus:border-gray-900 outline-none disabled:bg-gray-100 disabled:text-gray-400"
                    >
                      <option value="">Select Subcategory</option>
                      {subcategories.filter(s => s.categoryId === formData.category).map(s => (
                         <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Images</label>
                  <div className="flex items-center gap-4 mb-2">
                    <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-xl transition-colors inline-flex items-center border border-gray-200">
                       <Upload className="w-4 h-4 mr-2" />
                       Upload Photo
                       <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={handleImageUpload}
                       />
                    </label>
                    <span className="text-xs text-gray-500">Max 5 photos (Auto compressed)</span>
                  </div>
                  {formData.images.length > 0 && (
                    <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 mt-4">
                      {formData.images.map((url, idx) => (
                        <div key={idx} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 border border-gray-200 group shadow-sm">
                          <img src={url} alt="" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removeImage(idx)}
                            className="absolute top-1.5 right-1.5 bg-red-500 drop-shadow-md text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end pt-6 border-t border-gray-100 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 text-gray-600 hover:bg-gray-50 font-medium rounded-xl mr-3 font-medium transition-colors">
                  Cancel
                </button>
                <button type="submit" className="px-6 py-2.5 bg-gray-900 text-white font-medium rounded-xl hover:bg-gray-800 transition-colors shadow-md">
                  {editingId ? 'Update Product' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
