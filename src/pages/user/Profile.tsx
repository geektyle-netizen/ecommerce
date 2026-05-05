import { AppUser } from '../../App';
import { User, Mail, Shield } from 'lucide-react';
import { auth } from '../../firebase';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

export default function Profile({ user }: { user: AppUser }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold tracking-tight text-gray-900">Your Profile</h1>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
        <div className="flex items-center mb-8 pb-8 border-b border-gray-100 relative">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mr-6">
            <User className="w-10 h-10 text-gray-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">{user.email?.split('@')[0]}</h2>
            <div className="flex items-center text-gray-500">
              <Mail className="w-4 h-4 mr-2" />
              {user.email}
            </div>
          </div>
          
          {user.role === 'admin' && (
            <div className="absolute top-0 right-0 bg-purple-50 text-purple-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center">
              <Shield className="w-4 h-4 mr-1" />
              Administrator
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Account Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="bg-gray-50 p-4 rounded-2xl">
                <p className="text-sm text-gray-500 mb-1">Account ID</p>
                <p className="font-mono text-sm text-gray-900">{user.uid}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-2xl">
                 <p className="text-sm text-gray-500 mb-1">Member Since</p>
                 <p className="font-medium text-gray-900">
                   {user.createdAt?.toDate ? user.createdAt.toDate().toLocaleDateString() : 'N/A'}
                 </p>
              </div>
            </div>
          </div>
          
          <div className="pt-6">
             <button
                onClick={handleLogout}
                className="w-full sm:w-auto px-6 py-3 bg-red-50 text-red-600 font-medium rounded-xl hover:bg-red-100 transition-colors"
                >
               Sign Out Securely
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}
