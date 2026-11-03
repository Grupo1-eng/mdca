import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type SetStateAction,
} from "react"

function lerRascunho<T>(chave: string, inicial: T): T {
  const salvo = sessionStorage.getItem(chave)
  if (!salvo) return inicial

  try {
    const valor = JSON.parse(salvo) as T
    if (valor && typeof valor === "object" && !Array.isArray(valor)) {
      return { ...inicial as object, ...valor as object } as T
    }
    return valor
  } catch {
    return inicial
  }
}

export function useRascunho<T>(chave: string, inicial: T) {
  const inicialRef = useRef(inicial)
  const [valor, setValor] = useState<T>(inicial)
  const primeiraGravacao = useRef(true)

  useEffect(() => {
    setValor(lerRascunho(chave, inicialRef.current))
    primeiraGravacao.current = true
  }, [chave])

  useEffect(() => {
    if (primeiraGravacao.current) {
      primeiraGravacao.current = false
      return
    }
    sessionStorage.setItem(chave, JSON.stringify(valor))
  }, [chave, valor])

  const atualizar = useCallback(
    (proximo: SetStateAction<T>) => setValor(proximo),
    [],
  )
  const limpar = useCallback(() => sessionStorage.removeItem(chave), [chave])

  return [valor, atualizar, limpar] as const
}
