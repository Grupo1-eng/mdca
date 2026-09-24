import { request } from "./client";

/**
 * CRUD de um recurso do backend (GET /rota, POST /rota, PUT /rota/:id).
 * `normalizar` converte a resposta crua (ex.: Decimal em texto) no tipo da tela.
 */
export function recurso<T, TNovo, TApi = T>(rota: string, normalizar: (api: TApi) => T = (api) => api as unknown as T) {
  return {
    listar: async (): Promise<T[]> => (await request<TApi[]>(rota)).map(normalizar),
    criar: async (input: TNovo): Promise<T> =>
      normalizar(await request<TApi>(rota, { method: "POST", body: JSON.stringify(input) })),
    atualizar: async (id: number, input: Partial<TNovo>): Promise<T> =>
      normalizar(await request<TApi>(`${rota}/${id}`, { method: "PUT", body: JSON.stringify(input) })),
  };
}
