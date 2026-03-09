"use client";

import { useCallback, useState } from "react";

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function useApi<T, A extends unknown[]>(
  fetcher: (...args: A) => Promise<T>
) {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(
    async (...args: A) => {
      setState({ data: null, loading: true, error: null });
      try {
        const data = await fetcher(...args);
        setState({ data, loading: false, error: null });
        return data;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "An error occurred";
        setState({ data: null, loading: false, error: message });
        return null;
      }
    },
    [fetcher]
  );

  return { ...state, execute };
}
