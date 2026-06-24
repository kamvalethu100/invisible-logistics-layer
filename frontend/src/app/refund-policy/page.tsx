import { COMPANY_NAME } from '@/lib/constants';

export default function RefundPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto py-20 px-6">
      <h1 className="text-4xl font-bold mb-8">Refund and Cancellation Policy</h1>
      <p className="text-gray-600 mb-6 italic">Last updated: June 15, 2026</p>
      
      <div className="prose prose-blue max-w-none space-y-8">
        <section>
          <h2 className="text-2xl font-bold mb-4 text-gray-900">1. Cancellation by Business User</h2>
          <p className="text-gray-700 leading-relaxed">
            You may cancel a delivery request at any time before a Driver has been assigned. If a Driver has already been assigned and is en route to the pickup location, a <strong>Cancellation Fee</strong> may apply.
          </p>
          <ul className="list-disc pl-6 mt-4 space-y-2 text-gray-700">
            <li><strong>Before Assignment:</strong> Full refund / No charge.</li>
            <li><strong>After Assignment (Before Pickup):</strong> Cancellation fee of 25% of the delivery quote.</li>
            <li><strong>After Pickup:</strong> No refund possible. Full delivery fee applies.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4 text-gray-900">2. Service Failures</h2>
          <p className="text-gray-700 leading-relaxed">
            {COMPANY_NAME} strives for 100% reliability. If a delivery is not completed due to a technical failure of our platform or a Driver's failure to complete the task as assigned, a full refund of the delivery fee will be issued to your account balance.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4 text-gray-900">3. Non-Refundable Items</h2>
          <p className="text-gray-700 leading-relaxed">
            Fees paid for premium subscription tiers or "Gold Status" verification for Drivers are generally non-refundable once the service has been provisioned.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4 text-gray-900">4. Disputes</h2>
          <p className="text-gray-700 leading-relaxed">
            All refund requests must be submitted within 24 hours of the delivery attempt. Please include the Delivery ID and a brief description of the issue. Our support team will review and respond within 1 business day.
          </p>
        </section>

        <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
          <p className="text-blue-800 text-sm font-medium">
            Contact <strong>billing@logistiqs.live</strong> for all refund-related inquiries. All refunds are processed back to the original payment method or credited to your LogistiQS wallet within 5-10 business days.
          </p>
        </div>
      </div>
    </div>
  );
}
