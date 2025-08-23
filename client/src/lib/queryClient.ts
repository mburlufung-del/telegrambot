import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 0, // Always consider data stale for fresh updates
      gcTime: 1000 * 60 * 5, // Keep in cache for 5 minutes
      queryFn: async ({ queryKey }: { queryKey: readonly unknown[] }) => {
        const url = queryKey[0] as string
        console.log(`[QueryClient] Fetching: ${url}`)
        const res = await fetch(url)
        if (!res.ok) {
          throw new Error(`${res.status}: ${res.statusText}`)
        }
        const data = await res.json()
        console.log(`[QueryClient] Success: ${url} - ${Array.isArray(data) ? data.length : 'non-array'} items`)
        return data
      },
    },
  },
})

export async function apiRequest<T = any>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  })

  if (!res.ok) {
    throw new Error(`${res.status}: ${res.statusText}`)
  }

  return res.json()
}