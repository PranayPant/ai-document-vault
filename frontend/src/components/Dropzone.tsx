'use client';

import { useCallback, useState } from 'react';
import { useDropzone, type FileWithPath } from 'react-dropzone';
import { useParams, usePathname, useRouter } from 'next/navigation';

interface DropzoneProps {
  children: React.ReactNode;
}

export default function Dropzone({ children }: DropzoneProps) {
  const [uploading, setUploading] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    // Pattern: Looks for "/folder/" followed by 
    // non-slash characters at the VERY END of the string ($)
    // Capture Group 1 (([^/]+)) contains the UUID.
    const folderMatch = pathname.match(/\/folder\/([^/]+)$/);

    if (!folderMatch) {
      // This handles "/dashboard" (Root) or invalid paths
      alert("Please navigate into a folder before uploading.");
      return;
    }

    // The UUID is the first capture group
    const currentFolderId = folderMatch[1]; 

    setUploading(true);

    try {
      for (const file of acceptedFiles) {
        const dropzoneFile = file as FileWithPath;
        // Strip leading slash from relative path
        const relativePath = (dropzoneFile.path || file.name).replace(/^\//, '');

        const formData = new FormData();
        formData.append('file', file);
        formData.append('filePath', relativePath);
        formData.append('parentFolderId', currentFolderId); // We are guaranteed to have this now

        await fetch('/api/documents', {
          method: 'POST',
          body: formData,
        });
      }

      router.refresh();
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  }, [pathname, router]);

  const { getRootProps, getInputProps, open, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
    noKeyboard: true,
    noClick: true,
    maxFiles: 10,
    maxSize: 5 * 1000 * 1024 // 5MB
  });

  return (
    <>
      <button
        type="button"
        className="my-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 my-2"
        onClick={open}
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        Upload
      </button>
      <div {...getRootProps()} className="relative min-h-screen">
        <input {...getInputProps()} />
        
        {/* Drag overlay */}
        {isDragActive && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-blue-500/20 backdrop-blur-sm">
            <div className="rounded-lg bg-white p-8 shadow-2xl dark:bg-gray-800">
              <div className="flex flex-col items-center gap-4">
                <svg className="h-16 w-16 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-xl font-semibold text-gray-900 dark:text-white">
                  Drop files here to upload
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Upload indicator */}
        {uploading && (
          <div className="fixed bottom-4 right-4 z-40 rounded-lg bg-blue-500 px-4 py-3 text-white shadow-lg">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              <span>Uploading...</span>
            </div>
          </div>
        )}

        {children}
      </div>
    </>
  );
}