export default function Contact() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <h1 className="text-4xl font-extrabold text-gray-900 mb-6">Contact Us</h1>
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
        <h2 className="text-2xl font-bold mb-4">Get in Touch</h2>
        <p className="text-gray-600 mb-6">If you have any questions or concerns, please feel free to reach out to us using the methods below or the chat icon on the bottom right.</p>
        <div className="space-y-4">
          <p className="flex items-center text-gray-700">
            <span className="font-bold mr-2">Email:</span> support@eshop.example.com
          </p>
          <p className="flex items-center text-gray-700">
            <span className="font-bold mr-2">Phone:</span> +1 234 567 8900
          </p>
          <p className="flex items-center text-gray-700">
            <span className="font-bold mr-2">Address:</span> 123 E-Commerce Way, Tech City, TC 10101
          </p>
        </div>
      </div>
    </div>
  );
}
