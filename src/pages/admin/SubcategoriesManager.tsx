import { useState, useEffect } from 'react';
import { collection, query, getDocs, doc, setDoc, deleteDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../firebase';
import { Plus, Trash2, Edit2, X, Check } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SubcategoriesManager() {
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCategoryId, setNewCategoryId] = useState('');
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editCategoryId, setEditCategoryId] = useState('');

  const fetchData = async () => {
    try {
      // Fetch categories
      const catSnap = await getDocs(query(collection(db, 'categories'), orderBy('name', 'asc')));
      const cats = catSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setCategories(cats);
      
      // Fetch subcategories
      const subSnap = await getDocs(query(collection(db, 'subcategories'), orderBy('createdAt', 'desc')));
      setSubcategories(subSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'subcategories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newCategoryId) return;
    try {
      const newDocRef = doc(collection(db, 'subcategories'));
      await setDoc(newDocRef, {
        name: newName.trim(),
        categoryId: newCategoryId,
        createdAt: serverTimestamp()
      });
      toast.success('Subcategory added');
      setNewName('');
      setNewCategoryId('');
      setIsAdding(false);
      fetchData();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'subcategories');
    }
  };

  const handleUpdate = async (id: string) => {
    if (!editName.trim() || !editCategoryId) return;
    try {
      await setDoc(doc(db, 'subcategories', id), { 
        name: editName.trim(),
        categoryId: editCategoryId
      }, { merge: true });
      toast.success('Subcategory updated');
      setEditingId(null);
      fetchData();
    } catch (error) {
       handleFirestoreError(error, OperationType.UPDATE, `subcategories/${id}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this subcategory?')) return;
    try {
      await deleteDoc(doc(db, 'subcategories', id));
      toast.success('Subcategory deleted');
      fetchData();
    } catch (error) {
       handleFirestoreError(error, OperationType.DELETE, `subcategories/${id}`);
    }
  };

  const getCategoryName = (id: string) => {
    return categories.find(c => c.id === id)?.name || 'Unknown';
  };

  if (loading) return <div className="py-10 text-center">Loading subcategories...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">Subcategories</h2>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Add Subcategory</span>
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleAdd} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4">
          <select
             value={newCategoryId}
             onChange={e => setNewCategoryId(e.target.value)}
             required
             className="w-full sm:w-auto border border-gray-200 rounded-xl px-4 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white"
          >
             <option value="">Select Category</option>
             {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Subcategory name"
            required
            className="flex-1 w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            autoFocus
          />
          <div className="flex space-x-2 w-full sm:w-auto">
             <button type="submit" className="flex-1 sm:flex-none bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700">Add</button>
             <button type="button" onClick={() => setIsAdding(false)} className="text-gray-500 hover:bg-gray-100 p-2 rounded-xl"><X className="w-5 h-5" /></button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Subcategory Name</th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {subcategories.map((sub) => (
              <tr key={sub.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                   {editingId === sub.id ? (
                      <select
                         value={editCategoryId}
                         onChange={e => setEditCategoryId(e.target.value)}
                         className="border border-gray-200 rounded-lg px-2 py-1 text-sm outline-none bg-white w-full max-w-[150px]"
                      >
                         <option value="">Select Category</option>
                         {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                   ) : getCategoryName(sub.categoryId)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                  {editingId === sub.id ? (
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="border border-gray-200 rounded-lg px-3 py-1 text-sm focus:ring-indigo-500 focus:border-indigo-500 outline-none w-full max-w-xs"
                      autoFocus
                    />
                  ) : (
                     sub.name
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                  {editingId === sub.id ? (
                    <>
                      <button onClick={() => handleUpdate(sub.id)} className="text-green-600 hover:text-green-900 p-1 bg-green-50 rounded-lg"><Check className="w-5 h-5" /></button>
                      <button onClick={() => setEditingId(null)} className="text-gray-600 hover:text-gray-900 p-1 bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => { setEditingId(sub.id); setEditName(sub.name); setEditCategoryId(sub.categoryId); }} className="text-indigo-600 hover:text-indigo-900 p-1.5 hover:bg-indigo-50 rounded-lg transition-colors"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(sub.id)} className="text-red-600 hover:text-red-900 p-1.5 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {subcategories.length === 0 && (
              <tr>
                <td colSpan={3} className="px-6 py-8 text-center text-gray-500 text-sm">No subcategories found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
