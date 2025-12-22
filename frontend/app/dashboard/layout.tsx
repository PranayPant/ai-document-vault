import Dropzone from '@/src/components/Dropzone';
import UploadButton from '@/src/components/UploadButton';
import Link from 'next/link';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Top Navbar */}
      <nav className="sticky top-0 z-40 border-b border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/dashboard" className="flex items-center gap-2">
            <svg className="h-8 w-8 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
            </svg>
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              AI Document Vault
            </span>
          </Link>

          <div className="flex items-center gap-4">
            <UploadButton />

            <Link
              href="/"
              className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </nav>

      {/* Main content wrapped in Dropzone */}
      <Dropzone>
        {children}
      </Dropzone>
    </div>
  );
}
