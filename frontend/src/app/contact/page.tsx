import { COMPANY_NAME } from '@/lib/constants';

export default function ContactPage() {
  return (
    <div className="max-w-4xl mx-auto py-20 px-6">
      <h1 className="text-4xl font-bold mb-8">Contact & Support</h1>
      <p className="text-gray-600 mb-12 max-w-2xl text-lg">
        Our team is available to assist you with any questions regarding deliveries, driver registration, or enterprise partnerships.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="space-y-8">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Corporate Headquarters</h2>
            <p className="text-gray-600">
              <strong>{COMPANY_NAME}</strong><br />
              123 Logistics Way, Faraday Street<br />
              Johannesburg, 2001<br />
              South Africa
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Email Channels</h2>
            <ul className="space-y-2 text-gray-600 font-medium">
              <li>General: <a href="mailto:info@logistiqs.live" className="text-blue-600">info@logistiqs.live</a></li>
              <li>Support: <a href="mailto:support@logistiqs.live" className="text-blue-600">support@logistiqs.live</a></li>
              <li>Legal: <a href="mailto:legal@logistiqs.live" className="text-blue-600">legal@logistiqs.live</a></li>
              <li>Billing: <a href="mailto:billing@logistiqs.live" className="text-blue-600">billing@logistiqs.live</a></li>
            </ul>
          </div>
        </div>

        <div className="bg-blue-600 rounded-3xl p-10 text-white shadow-2xl shadow-blue-200">
          <h2 className="text-2xl font-bold mb-6">Need Immediate Help?</h2>
          <p className="mb-8 text-blue-100 leading-relaxed">
            If you have an active delivery in progress, please use the live chat within the dashboard for the fastest response.
          </p>
          <div className="space-y-4">
            <div className="flex items-center gap-4 bg-white/10 p-4 rounded-2xl border border-white/20">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-blue-600 font-black">24/7</div>
              <div>
                <p className="text-sm font-bold opacity-80 uppercase tracking-tighter">Business Support</p>
                <p className="font-bold">+27 (0) 11 555 0123</p>
              </div>
            </div>
            <div className="flex items-center gap-4 bg-white/10 p-4 rounded-2xl border border-white/20">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-blue-600 font-black">LIVE</div>
              <div>
                <p className="text-sm font-bold opacity-80 uppercase tracking-tighter">Driver Dispatch</p>
                <p className="font-bold">+27 (0) 11 555 0124</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
