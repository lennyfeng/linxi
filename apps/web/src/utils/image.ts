/**
 * Image utilities: lazy loading and MinIO presign URL caching.
 */

const presignCache = new Map<string, { url: string; expiresAt: number }>();
const PRESIGN_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

/**
 * Get a presigned URL for a MinIO object key.
 * Results are cached in memory to avoid redundant API calls.
 */
export async function getPresignedUrl(objectKey: string, apiBase = ''): Promise<string> {
  const cached = presignCache.get(objectKey);
  if (cached && cached.expiresAt > Date.now()) return cached.url;

  const res = await fetch(`${apiBase}/files/presign?key=${encodeURIComponent(objectKey)}`);
  if (!res.ok) throw new Error(`Failed to get presigned URL for ${objectKey}`);
  const data = await res.json();
  const url = data?.data?.url || data?.url || '';

  presignCache.set(objectKey, { url, expiresAt: Date.now() + PRESIGN_CACHE_TTL });
  return url;
}

/** Clear the presign cache (useful on logout) */
export function clearPresignCache(): void {
  presignCache.clear();
}

/**
 * Create an IntersectionObserver-based lazy loading directive.
 * Useful for image galleries or product lists.
 *
 * Usage:
 *   const observer = createLazyImageObserver();
 *   observer.observe(imgElement);
 */
export function createLazyImageObserver(rootMargin = '200px'): IntersectionObserver {
  return new IntersectionObserver(
    (entries, obs) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          const src = img.dataset.src;
          if (src) {
            img.src = src;
            img.removeAttribute('data-src');
          }
          obs.unobserve(img);
        }
      }
    },
    { rootMargin },
  );
}
