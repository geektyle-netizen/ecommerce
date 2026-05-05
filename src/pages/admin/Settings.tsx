import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../firebase';
import { Save, ShieldAlert } from 'lucide-react';

export default function Settings() {
  const [razorpayId, setRazorpayId] = useState('');
  const [razorpaySecret, setRazorpaySecret] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, 'settings', 'admin');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setRazorpayId(data.razorpayMerchantId || '');
          setRazorpaySecret(data.razorpayMerchantSecret || '');
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'settings/admin');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      await setDoc(doc(db, 'settings', 'admin'), {
        razorpayMerchantId: razorpayId,
        razorpayMerchantSecret: razorpaySecret
      }, { merge: true });
      setMessage('Settings saved successfully!');
    } catch (error) {
       handleFirestoreError(error, OperationType.UPDATE, 'settings/admin');
       setMessage('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-center py-20">Loading settings...</div>;

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold mb-8">Admin Settings</h1>
      
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-orange-50 p-6 border-b border-gray-200 flex items-start">
          <ShieldAlert className="w-6 h-6 text-orange-500 mr-3 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-md font-bold text-gray-900 mb-1">Configuration Security</h3>
            <p className="text-sm text-gray-700">
              Only users with the 'admin' role can view or modify these settings. 
              These keys are used by the backend Node.js server to process payments securely.
              Never share your Razorpay Key Secret.
            </p>
          </div>
        </div>
        
        <form onSubmit={handleSave} className="p-6 space-y-6">
          <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2">Payment Gateway (Razorpay)</h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Merchant Key ID</label>
            <input
              type="text"
              value={razorpayId}
              onChange={(e) => setRazorpayId(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-gray-900 focus:border-gray-900 outline-none font-mono text-sm"
              placeholder="rzp_live_..."
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Merchant Key Secret</label>
            <input
              type="password"
              value={razorpaySecret}
              onChange={(e) => setRazorpaySecret(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-gray-900 focus:border-gray-900 outline-none font-mono text-sm"
              placeholder="••••••••••••••••••••••••"
            />
          </div>

          <div className="flex items-center justify-between pt-4">
            <span className={`text-sm font-medium ${message.includes('successfully') ? 'text-green-600' : 'text-red-600'}`}>
              {message}
            </span>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
