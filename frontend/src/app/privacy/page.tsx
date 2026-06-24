import { COMPANY_NAME } from '@/lib/constants';

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto py-20 px-6">
      <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
      <p className="text-gray-600 mb-6 italic">Last updated: June 15, 2026</p>
      
      <div className="prose prose-blue max-w-none space-y-8">
        <section>
          <h2 className="text-2xl font-bold mb-4 text-gray-900">1. Information We Collect</h2>
          <p className="text-gray-700 leading-relaxed">
            We collect personal information that you voluntarily provide to us when you register on the LogistiQS platform.
          </p>
          <ul className="list-disc pl-6 mt-4 space-y-2 text-gray-700">
            <li><strong>Business Users:</strong> Business name, email, phone number, and physical addresses for pickup/drop-off.</li>
            <li><strong>Drivers:</strong> Legal name, identity documents, vehicle information, and <strong>Real-time Location Data</strong> when the app is in use.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4 text-gray-900">2. Real-Time Tracking</h2>
          <p className="text-gray-700 leading-relaxed">
            To provide our core service, we track the precise location of Drivers when they are "Online" or on an active delivery. This data is shared with the Business User associated with the delivery for real-time tracking purposes.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4 text-gray-900">3. How We Use Your Information</h2>
          <p className="text-gray-700 leading-relaxed">
            We use the information we collect to facilitate the matching of drivers with jobs, process payments, and improve the reliability of our logistics engine.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4 text-gray-900">4. Data Security</h2>
          <p className="text-gray-700 leading-relaxed">
            We implement appropriate technical and organizational security measures to protect your personal information. However, please remember that no electronic transmission over the internet can be guaranteed 100% secure.
          </p>
        </section>

        <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
          <p className="text-gray-600 text-sm italic">
            {COMPANY_NAME} is committed to protecting your data. If you have questions about this policy, please contact <strong>privacy@logistiqs.live</strong>.
          </p>
        </div>
      </div>
    </div>
  );
}
