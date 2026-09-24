import { useCallback, useEffect, useState } from "react";
import { ApiError } from "@/api/client";

export interface UseFetchResult<T> {
  data: T;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/** Para chamadas somente-leitura (ex.: relatórios) que não precisam de create/update — ver useApiResource para essas. */
export function useFetch<T>(fetcher: () => Promise<T>, initial: T): UseFetchResult<T> {
  const [data, setData] = useState<T>(initial);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await fetcher());
    } catch (err) {
      const message =
        err instanceof ApiError || err instanceof Error ? err.message : "Não foi possível carregar os dados.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [fetcher]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, loading, error, refetch };
}
