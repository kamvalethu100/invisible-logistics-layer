import { COMPANY_NAME } from '@/lib/constants';

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto py-20 px-6">
      <h1 className="text-4xl font-bold mb-8">Terms and Conditions</h1>
      <p className="text-gray-600 mb-6 italic">Last updated: June 15, 2026</p>
      
      <div className="prose prose-blue max-w-none space-y-8">
        <section>
          <h2 className="text-2xl font-bold mb-4 text-gray-900">1. Agreement to Terms</h2>
          <p className="text-gray-700 leading-relaxed">
            These Terms and Conditions constitute a legally binding agreement made between you, whether personally or on behalf of an entity (“you”) and <strong>{COMPANY_NAME}</strong> (“we,” “us” or “our”), concerning your access to and use of the LogistiQS platform and any other media form, media channel, mobile website or mobile application related, linked, or otherwise connected thereto.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4 text-gray-900">2. Description of Services</h2>
          <p className="text-gray-700 leading-relaxed">
            LogistiQS provides a real-time logistics coordination platform designed to remove delivery coordination friction for small and medium-sized businesses (SMEs). We provide an orchestration layer that matches Business Users with independent Drivers for the transport of goods.
          </p>
          <p className="mt-4 text-gray-700 font-bold">
            Note: {COMPANY_NAME} is a technology service provider and is not a common carrier, freight forwarder, or delivery service.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4 text-gray-900">3. User Obligations</h2>
          <ul className="list-disc pl-6 space-y-2 text-gray-700">
            <li><strong>Accuracy:</strong> You must provide accurate pickup and drop-off locations and package details.</li>
            <li><strong>Lawfulness:</strong> You shall not use the service to transport illegal, hazardous, or restricted items.</li>
            <li><strong>Payment:</strong> Business users agree to pay all fees for deliveries requested through the platform as quoted.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4 text-gray-900">4. Driver Status</h2>
          <p className="text-gray-700 leading-relaxed">
            Drivers are independent contractors and not employees of {COMPANY_NAME}. We are not responsible for the conduct, actions, or omissions of any Driver.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4 text-gray-900">5. Limitation of Liability</h2>
          <p className="text-gray-700 leading-relaxed">
            In no event will {COMPANY_NAME} be liable for any indirect, consequential, exemplary, incidental, special or punitive damages, including lost profit, lost revenue, or loss of data arising from your use of the platform.
          </p>
        </section>

        <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
          <p className="text-gray-600 text-sm">
            For inquiries regarding these terms, contact our legal department at <strong>legal@logistiqs.live</strong> or visit our office at <strong>LogistiQS SA (Pty) Ltd, Johannesburg, South Africa.</strong>
          </p>
        </div>
      </div>
    </div>
  );
}
