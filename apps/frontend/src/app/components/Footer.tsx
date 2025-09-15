import { ComponentErrorBoundary } from './ErrorBoundary';

export default function Footer() {
  return (
    <ComponentErrorBoundary>
      <footer className="bg-white border-t mt-8">
        <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col md:flex-row items-center justify-between text-gray-500 text-sm">
          <span>&copy; {new Date().getFullYear()} Orderly. All rights reserved.</span>
          <div className="flex space-x-4 mt-2 md:mt-0">
            <a href="#" className="hover:text-blue-600">Privacy Policy</a>
            <a href="#" className="hover:text-blue-600">Terms of Service</a>
          </div>
        </div>
      </footer>
    </ComponentErrorBoundary>
  );
} 