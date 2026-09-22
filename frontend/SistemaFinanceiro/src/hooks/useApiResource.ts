import { useCallback, useEffect, useState } from "react";
import { ApiError } from "@/api/client";

interface ResourceApi<T, TCreate, TUpdate> {
  list: () => Promise<T[]>;
  create: (input: TCreate) => Promise<T>;
  update: (id: string, input: TUpdate) => Promise<T>;
}

export interface UseApiResourceResult<T, TCreate, TUpdate> {
  data: T[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  create: (input: TCreate) => Promise<T>;
  update: (id: string, input: TUpdate) => Promise<T>;
}

function errorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return "Não foi possível completar a operação.";
}

/**
 * Casca comum para listar/criar/editar um recurso da API financeira: cuida de
 * loading/erro e mantém a lista local sincronizada após create/update, sem
 * repetir esse controle em cada hook de recurso (useLancamentos, useProjetos...).
 */
export function useApiResource<T extends { id: string }, TCreate = Partial<T>, TUpdate = Partial<T>>(
  api: ResourceApi<T, TCreate, TUpdate>,
): UseApiResourceResult<T, TCreate, TUpdate> {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await api.list());
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const create = useCallback(
    async (input: TCreate) => {
      const created = await api.create(input);
      setData((prev) => [...prev, created]);
      return created;
    },
    [api],
  );

  const update = useCallback(
    async (id: string, input: TUpdate) => {
      const updated = await api.update(id, input);
      setData((prev) => prev.map((item) => (item.id === id ? updated : item)));
      return updated;
    },
    [api],
  );

  return { data, loading, error, refetch, create, update };
}
