import { useState, useEffect } from 'react';
import { collection, query, getDocs, doc, setDoc, deleteDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../firebase';
import { Plus, Trash2, Edit2, X, Check } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CategoriesManager() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const fetchCategories = async () => {
    try {
      const q = query(collection(db, 'categories'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      setCategories(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      const newDocRef = doc(collection(db, 'categories'));
      await setDoc(newDocRef, {
        name: newName.trim(),
        createdAt: serverTimestamp()
      });
      toast.success('Category added');
      setNewName('');
      setIsAdding(false);
      fetchCategories();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'categories');
    }
  };

  const handleUpdate = async (id: string) => {
    if (!editName.trim()) return;
    try {
      await setDoc(doc(db, 'categories', id), { name: editName.trim() }, { merge: true });
      toast.success('Category updated');
      setEditingId(null);
      fetchCategories();
    } catch (error) {
       handleFirestoreError(error, OperationType.UPDATE, `categories/${id}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    try {
      await deleteDoc(doc(db, 'categories', id));
      toast.success('Category deleted');
      fetchCategories();
    } catch (error) {
       handleFirestoreError(error, OperationType.DELETE, `categories/${id}`);
    }
  };

  if (loading) return <div className="py-10 text-center">Loading categories...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">Categories</h2>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Add Category</span>
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleAdd} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Category name"
            className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            autoFocus
          />
          <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700">Add</button>
          <button type="button" onClick={() => setIsAdding(false)} className="text-gray-500 hover:bg-gray-100 p-2 rounded-xl"><X className="w-5 h-5" /></button>
        </form>
      )}

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {categories.map((category) => (
              <tr key={category.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {editingId === category.id ? (
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="border border-gray-200 rounded-lg px-3 py-1 text-sm focus:ring-indigo-500 focus:border-indigo-500 outline-none w-full max-w-xs"
                      autoFocus
                    />
                  ) : (
                    category.name
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                  {editingId === category.id ? (
                    <>
                      <button onClick={() => handleUpdate(category.id)} className="text-green-600 hover:text-green-900 p-1 bg-green-50 rounded-lg"><Check className="w-5 h-5" /></button>
                      <button onClick={() => setEditingId(null)} className="text-gray-600 hover:text-gray-900 p-1 bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => { setEditingId(category.id); setEditName(category.name); }} className="text-indigo-600 hover:text-indigo-900 p-1.5 hover:bg-indigo-50 rounded-lg transition-colors"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(category.id)} className="text-red-600 hover:text-red-900 p-1.5 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {categories.length === 0 && (
              <tr>
                <td colSpan={2} className="px-6 py-8 text-center text-gray-500 text-sm">No categories found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
