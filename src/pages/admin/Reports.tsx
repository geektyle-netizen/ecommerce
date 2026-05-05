import { useState } from 'react';
import { collection, query, getDocs, where, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../firebase';
import { Download, FileText, Filter } from 'lucide-react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

export default function Reports() {
  const [dateRange, setDateRange] = useState('7'); // days
  const [reportType, setReportType] = useState('sales');
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any[] | null>(null);

  const generateReport = async () => {
    setLoading(true);
    try {
      const startDate = startOfDay(subDays(new Date(), parseInt(dateRange)));
      const endDate = endOfDay(new Date());

      if (reportType === 'sales') {
        // Query orders within date range
        // Since we don't have compound index created on UI, we might have to fetch and filter if index error occurs
        // Using straightforward approach
        const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        
        const data = snap.docs
           .map(d => ({ id: d.id, ...d.data() } as any))
           .filter(o => o.createdAt && o.createdAt.toDate() >= startDate && o.createdAt.toDate() <= endDate);

        setReportData(data);
      } else if (reportType === 'inventory') {
         const q = query(collection(db, 'products'));
         const snap = await getDocs(q);
         const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
         setReportData(data);
      }
    } catch (error) {
       handleFirestoreError(error, OperationType.LIST, 'multiple');
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = () => {
    if (!reportData) return;

    let csv = '';
    if (reportType === 'sales') {
      csv = 'Order ID,Date,Status,Total Amount,Payment ID\n';
      reportData.forEach(row => {
        const date = row.createdAt?.toDate ? format(row.createdAt.toDate(), 'yyyy-MM-dd') : '';
        csv += `${row.id},${date},${row.status},${row.totalAmount},${row.paymentId || ''}\n`;
      });
    } else {
      csv = 'Product ID,Tile,Category,Price,Inventory\n';
      reportData.forEach(row => {
        csv += `${row.id},"${row.title}",${row.category},${row.price},${row.inventory}\n`;
      });
    }

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportType}_report_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Custom Reports</h1>

      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
          <select 
            value={reportType} 
            onChange={(e) => setReportType(e.target.value)}
            className="bg-gray-50 border border-gray-200 text-gray-900 rounded-xl focus:ring-gray-900 focus:border-gray-900 block w-48 p-2.5 outline-none"
          >
            <option value="sales">Sales & Orders</option>
            <option value="inventory">Inventory Stock</option>
          </select>
        </div>

        {reportType === 'sales' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
            <select 
              value={dateRange} 
              onChange={(e) => setDateRange(e.target.value)}
              className="bg-gray-50 border border-gray-200 text-gray-900 rounded-xl focus:ring-gray-900 focus:border-gray-900 block w-48 p-2.5 outline-none"
            >
              <option value="7">Last 7 Days</option>
              <option value="30">Last 30 Days</option>
              <option value="90">Last 90 Days</option>
              <option value="365">Last 1 Year</option>
            </select>
          </div>
        )}

        <button 
          onClick={generateReport}
          disabled={loading}
          className="px-6 py-2.5 bg-gray-900 text-white font-medium rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center"
        >
          <Filter className="w-4 h-4 mr-2" />
          {loading ? 'Generating...' : 'Generate Report'}
        </button>

        {reportData && (
          <button 
            onClick={downloadCSV}
            className="px-6 py-2.5 bg-white border border-gray-200 text-gray-900 font-medium rounded-xl hover:bg-gray-50 transition-colors flex items-center ml-auto"
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </button>
        )}
      </div>

      {reportData && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-x-auto p-6">
          <h2 className="text-lg font-bold mb-4 flex items-center">
            <FileText className="w-5 h-5 mr-2 text-gray-400" />
            Report Results ({reportData.length} records)
          </h2>
          
          {reportData.length === 0 ? (
            <p className="text-gray-500 py-4">No data found for the selected criteria.</p>
          ) : reportType === 'sales' ? (
            <table className="min-w-full divide-y divide-gray-200">
               <thead className="bg-gray-50">
                 <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Total Amount (₹)</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-200">
                  {reportData.map((row: any) => (
                    <tr key={row.id}>
                      <td className="px-4 py-3 text-sm font-mono text-gray-500">{row.id}</td>
                      <td className="px-4 py-3 text-sm">{row.createdAt?.toDate ? format(row.createdAt.toDate(), 'PP') : '-'}</td>
                      <td className="px-4 py-3 text-sm capitalize">{row.status}</td>
                      <td className="px-4 py-3 text-sm text-right font-medium">₹{row.totalAmount}</td>
                    </tr>
                  ))}
               </tbody>
            </table>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
               <thead className="bg-gray-50">
                 <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Price (₹)</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Inventory</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-200">
                  {reportData.map((row: any) => (
                    <tr key={row.id}>
                      <td className="px-4 py-3 text-sm font-medium">{row.title}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{row.category}</td>
                      <td className="px-4 py-3 text-sm text-right">₹{row.price}</td>
                      <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">{row.inventory}</td>
                    </tr>
                  ))}
               </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
