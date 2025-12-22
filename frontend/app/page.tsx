import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Top Navigation */}
      <nav className="border-b border-gray-200 bg-white/80 backdrop-blur-sm dark:border-gray-700 dark:bg-gray-900/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <svg className="h-8 w-8 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
            </svg>
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              AI Document Vault
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button className="rounded px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
              Login
            </button>
            <button className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700">
              Sign Up
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex min-h-[calc(100vh-73px)] items-center justify-center px-4 py-12">
        <div className="text-center">
          <h1 className="mb-6 text-5xl font-bold text-gray-900 dark:text-white sm:text-6xl">
            Your Documents,
            <br />
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              AI-Powered
            </span>
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-gray-600 dark:text-gray-300">
            Upload, organize, and extract insights from your documents with the power of AI.
            Automatic summarization, markdown conversion, and intelligent search.
          </p>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-8 py-4 text-lg font-semibold text-white shadow-lg transition-all hover:bg-blue-700 hover:shadow-xl"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Go to Dashboard
            </Link>
            <button className="inline-flex items-center gap-2 rounded-lg border-2 border-gray-300 bg-white px-8 py-4 text-lg font-semibold text-gray-700 transition-all hover:border-gray-400 hover:shadow-lg dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:border-gray-500">
              Learn More
            </button>
          </div>

          {/* Features Grid */}
          <div className="mx-auto mt-20 grid max-w-5xl gap-8 sm:grid-cols-3">
            <div className="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
              <div className="mb-4 flex justify-center">
                <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900">
                  <svg className="h-8 w-8 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
              </div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                Easy Upload
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Drag and drop your documents or click to upload. Supports PDF, Word, Excel, and more.
              </p>
            </div>

            <div className="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
              <div className="mb-4 flex justify-center">
                <div className="rounded-full bg-purple-100 p-3 dark:bg-purple-900">
                  <svg className="h-8 w-8 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
              </div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                AI Insights
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Automatic summarization and content extraction powered by advanced AI models.
              </p>
            </div>

            <div className="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
              <div className="mb-4 flex justify-center">
                <div className="rounded-full bg-green-100 p-3 dark:bg-green-900">
                  <svg className="h-8 w-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                </div>
              </div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                Organized
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Keep your documents organized in folders with powerful search capabilities.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}