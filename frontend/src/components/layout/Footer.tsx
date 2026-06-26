import Link from 'next/link';
import { COMPANY_NAME } from '@/lib/constants';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-gray-100 py-12 px-6 mt-auto">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="col-span-1 md:col-span-2">
          <h3 className="text-xl font-bold text-blue-600 mb-4">LogistiQS</h3>
          <p className="text-gray-500 max-w-sm">
            Providing premium, enterprise-grade logistics technology for small and medium businesses.
          </p>
          <p className="mt-6 text-sm text-gray-400">
            &copy; {currentYear} {COMPANY_NAME}. All rights reserved.
          </p>
        </div>
        
        <div>
          <h4 className="font-bold text-gray-900 mb-4">Legal</h4>
          <ul className="space-y-2">
            <li>
              <Link href="/terms" className="text-gray-500 hover:text-blue-600 transition-colors text-sm">
                Terms and Conditions
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="text-gray-500 hover:text-blue-600 transition-colors text-sm">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link href="/refund-policy" className="text-gray-500 hover:text-blue-600 transition-colors text-sm">
                Refund & Cancellation
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold text-gray-900 mb-4">Support</h4>
          <ul className="space-y-2">
            <li>
              <Link href="/contact" className="text-gray-500 hover:text-blue-600 transition-colors text-sm">
                Contact & Support
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
