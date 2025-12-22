/*
 * A component that will be rendered in a loop to render a list of FileResource items.
 * Uses a folder icon for folders and a file icon for files.
 * 
 * Each item is clickable (button or link - we want soft nav not hard nav) 
 * and displayed in a flexbox row pattern that wraps.
 * 
 * If item is type folder, clicking on it navigates user to /dashboard/[..currentPath]/[id], 
 * and displays the next level of folder contents. 
 * Each level fetches its own data from backend by passing the top-level folder id.
 * 
 * If item is type document, clicking on it changes the path to /dashboard/[..currentPath]/[id],
 * fetches the document data from backend, and displays the FileViewer component.
 */

'use client';

import Link from 'next/link';
import { FileResourceType } from '@/src/types/FileResource';

interface FileResourceItemProps {
  id: string;
  name: string;
  type: FileResourceType;
  currentPath?: string;
}

export default function FileResourceItem({ id, name, type, currentPath }: FileResourceItemProps) {
  const isFolder = type === FileResourceType.FOLDER;
  
  // Build the path for navigation with type prefix
  const typePrefix = isFolder ? FileResourceType.FOLDER : FileResourceType.DOCUMENT;
  const basePath = currentPath ? `/dashboard/${currentPath}` : '/dashboard';
  const href = `${basePath}/${typePrefix}/${id}`;

  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4 transition-all hover:border-blue-500 hover:shadow-md dark:border-gray-700 dark:bg-gray-800 dark:hover:border-blue-400"
    >
      {/* Icon */}
      <div className={`flex-shrink-0 ${isFolder ? 'text-yellow-500' : 'text-blue-500'}`}>
        {isFolder ? (
          <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
          </svg>
        ) : (
          <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
          </svg>
        )}
      </div>

      {/* Name */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-gray-900 group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
          {name}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {isFolder ? 'Folder' : 'Document'}
        </p>
      </div>

      {/* Arrow indicator */}
      <svg 
        className="h-5 w-5 flex-shrink-0 text-gray-400 transition-transform group-hover:translate-x-1 group-hover:text-blue-500 dark:group-hover:text-blue-400" 
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  );
}