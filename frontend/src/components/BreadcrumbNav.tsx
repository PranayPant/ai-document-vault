'use client';

import { useRouter } from 'next/navigation';
import { Breadcrumb } from '../types/backend';

interface BreadcrumbNavProps {
  breadcrumbs?: Breadcrumb[];
  currentItemName?: string;
}

export default function BreadcrumbNav({ breadcrumbs, currentItemName }: BreadcrumbNavProps) {
  const router = useRouter();

  return (
    <nav className="mb-6 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
      <button
        onClick={() => router.push('/dashboard')}
        className="hover:text-gray-900 dark:hover:text-white"
      >
        My Documents
      </button>
      
      {breadcrumbs?.map((crumb) => {
        const path = `/dashboard/folder/${crumb.id}`;
        
        return (
          <div key={crumb.id} className="flex items-center gap-2">
            <span>/</span>
            <button
              onClick={() => router.push(path)}
              className="hover:text-gray-900 dark:hover:text-white"
            >
              {crumb.name}
            </button>
          </div>
        );
      })}

      {/* Current item as final breadcrumb (non-clickable) */}
      {currentItemName && (
        <div className="flex items-center gap-2">
          <span>/</span>
          <span className="font-medium text-gray-900 dark:text-white">
            {currentItemName}
          </span>
        </div>
      )}
    </nav>
  );
}
