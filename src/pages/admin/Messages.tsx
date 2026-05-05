import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, updateDoc, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../firebase';
import { MessageSquare, Send, Check } from 'lucide-react';

export default function Messages() {
  const [chats, setChats] = useState<any[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    const qChats = query(collection(db, 'chats'), orderBy('updatedAt', 'desc'));
    const unsubscribe = onSnapshot(qChats, (snapshot) => {
      const chatsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setChats(chatsData);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'chats'));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!selectedChatId) return;
    const qMessages = query(collection(db, `chats/${selectedChatId}/messages`), orderBy('createdAt', 'asc'));
    const unsubscribe = onSnapshot(qMessages, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(msgs);
    }, (error) => handleFirestoreError(error, OperationType.LIST, `chats/${selectedChatId}/messages`));
    
    // Mark as read
    updateDoc(doc(db, 'chats', selectedChatId), { unreadCountAdmin: 0 }).catch(console.error);

    return () => unsubscribe();
  }, [selectedChatId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedChatId) return;

    try {
      const newMsgId = crypto.randomUUID();
      await setDoc(doc(db, `chats/${selectedChatId}/messages`, newMsgId), {
        text: replyText.trim(),
        sender: 'admin',
        createdAt: serverTimestamp()
      });
      await updateDoc(doc(db, 'chats', selectedChatId), {
        lastMessage: replyText.trim(),
        updatedAt: serverTimestamp(),
        unreadCountUser: 1
      });
      setReplyText('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `chats/${selectedChatId}/messages`);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
      <div className="flex h-full">
        {/* Sidebar */}
        <div className="w-1/3 border-r border-gray-100 flex flex-col">
          <div className="p-4 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-900">User Messages</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {chats.map(chat => (
              <button 
                key={chat.id}
                onClick={() => setSelectedChatId(chat.id)}
                className={`w-full text-left p-4 border-b border-gray-50 hover:bg-gray-50 flex items-start space-x-3 transition-colors ${selectedChatId === chat.id ? 'bg-indigo-50 border-l-4 border-l-indigo-600' : ''}`}
              >
                <div className="bg-indigo-100 w-10 h-10 rounded-full flex items-center justify-center text-indigo-700 font-bold shrink-0">
                  {chat.userEmail?.substring(0, 1).toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-0.5">
                     <p className="font-semibold text-gray-900 truncate">{chat.userEmail}</p>
                     {chat.unreadCountAdmin > 0 && <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{chat.unreadCountAdmin}</span>}
                  </div>
                  <p className="text-sm text-gray-500 truncate">{chat.lastMessage}</p>
                </div>
              </button>
            ))}
            {chats.length === 0 && (
               <div className="p-8 text-center text-gray-500">No chats found.</div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="w-2/3 flex flex-col bg-gray-50/30">
          {selectedChatId ? (
            <>
              <div className="p-4 border-b border-gray-100 bg-white shadow-sm flex items-center space-x-3">
                 <div className="bg-indigo-100 w-10 h-10 rounded-full flex items-center justify-center text-indigo-700 font-bold">
                    {chats.find(c => c.id === selectedChatId)?.userEmail?.substring(0, 1).toUpperCase()}
                 </div>
                 <h3 className="font-bold text-gray-900">{chats.find(c => c.id === selectedChatId)?.userEmail}</h3>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                 {messages.map(msg => (
                   <div key={msg.id} className={`flex ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                     <div className={`max-w-[75%] rounded-2xl px-4 py-2 ${msg.sender === 'admin' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white border border-gray-200 text-gray-900 rounded-bl-none'}`}>
                        {msg.imageUrl && (
                          <img src={msg.imageUrl} alt="attached" className="max-w-full rounded-xl mb-2 object-cover max-h-64" />
                        )}
                        <p className="whitespace-pre-wrap">{msg.text}</p>
                     </div>
                   </div>
                 ))}
              </div>
              <div className="p-4 bg-white border-t border-gray-100">
                 <form onSubmit={handleSend} className="flex items-center space-x-2">
                   <input
                     type="text"
                     value={replyText}
                     onChange={e => setReplyText(e.target.value)}
                     placeholder="Type your reply..."
                     className="flex-1 bg-gray-100 border-transparent rounded-full px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                   />
                   <button type="submit" disabled={!replyText.trim()} className="bg-indigo-600 text-white p-2.5 rounded-full hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                     <Send className="w-5 h-5" />
                   </button>
                 </form>
              </div>
            </>
          ) : (
             <div className="flex-1 flex flex-col justify-center items-center text-gray-400">
               <MessageSquare className="w-16 h-16 mb-4 opacity-50" />
               <p className="font-medium text-gray-500">Select a chat to view conversation</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
