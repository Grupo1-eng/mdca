import { useApiResource } from "./useApiResource";
import { createUsuario, getUsuarios, updateUsuario } from "@/api/usuarios";
import type { EdicaoUsuario, NovoUsuario, Usuario } from "@/types/financeiro";

const api = { list: getUsuarios, create: createUsuario, update: updateUsuario };

export function useUsuarios() {
  return useApiResource<Usuario, NovoUsuario, EdicaoUsuario>(api);
}
