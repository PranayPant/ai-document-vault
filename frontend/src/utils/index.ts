/**
 * Parse slug array into breadcrumb objects
 * @param slug - Array like ['folder', 'uuid-1', 'folder', 'uuid-2']
 * @returns Array of breadcrumb objects with type, id, and index
 */
export function parseSlugtoBreadcrumbs(slug?: string[]): Array<{ type: string; id: string; index: number }> {
  const breadcrumbs: Array<{ type: string; id: string; index: number }> = [];
  
  if (!slug) return breadcrumbs;
  
  for (let i = 0; i < slug.length; i += 2) {
    if (i + 1 < slug.length) {
      breadcrumbs.push({
        type: slug[i],
        id: slug[i + 1],
        index: i
      });
    }
  }
  
  return breadcrumbs;
}
