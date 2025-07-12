import { getTenantSlugFromUrl } from './tenant';

/**
 * Wrapper pro fetch, který automaticky přidává tenant hlavičku
 */
export function fetchWithTenant(url: string | URL, options?: RequestInit): Promise<Response> {
  const tenantSlug = getTenantSlugFromUrl();
  
  const headers = new Headers(options?.headers);
  headers.set('x-tenant-slug', tenantSlug);
  
  return fetch(url, {
    ...options,
    headers
  });
}