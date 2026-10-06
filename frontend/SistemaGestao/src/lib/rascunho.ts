import { useCallback, useEffect, useRef, useState, type SetStateAction } from "react";

function ler<T>(chave: string, inicial: T): T {
  if (typeof sessionStorage === "undefined") return inicial;
  const cru = sessionStorage.getItem(chave);
  if (!cru) return inicial;
  try {
    const salvo = JSON.parse(cru) as T;
    if (salvo && typeof salvo === "object" && !Array.isArray(salvo) && inicial && typeof inicial === "object") {
      return { ...(inicial as object), ...(salvo as object) } as T;
    }
    return salvo;
  } catch {
    return inicial;
  }
}

/** Mantém o formulário no sessionStorage até o salvamento ser confirmado. */
export function useRascunho<T>(chave: string, inicial: T) {
  const inicialRef = useRef(inicial);
  const [valor, setValor] = useState<T>(inicial);
  const pularGravacao = useRef(true);

  useEffect(() => {
    setValor(ler(chave, inicialRef.current));
    pularGravacao.current = true;
  }, [chave]);

  useEffect(() => {
    if (pularGravacao.current) {
      pularGravacao.current = false;
      return;
    }
    sessionStorage.setItem(chave, JSON.stringify(valor));
  }, [chave, valor]);

  const atualizar = useCallback((proximo: SetStateAction<T>) => {
    setValor(proximo);
  }, []);

  const limpar = useCallback(() => {
    sessionStorage.removeItem(chave);
  }, [chave]);

  return [valor, atualizar, limpar] as const;
}
