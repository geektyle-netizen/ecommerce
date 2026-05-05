export default function Faq() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <h1 className="text-4xl font-extrabold text-gray-900 mb-8">Frequently Asked Questions</h1>
      <div className="space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-2">How do I track my order?</h3>
          <p className="text-gray-600">You can track your order by logging into your account and visiting the 'My Orders' section.</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-2">What is your return policy?</h3>
          <p className="text-gray-600">We offer a 30-day return policy for unused and unopened products.</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-2">How can I cancel my order?</h3>
          <p className="text-gray-600">You can cancel your order directly from the 'My Orders' page before it is marked as shipped. You will need to complete a captcha verification to confirm the cancellation.</p>
        </div>
      </div>
    </div>
  );
}
