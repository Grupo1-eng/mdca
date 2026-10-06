// Só para testes: imita document.cookie, onde o client guarda o token.
// Entende "nome=valor; atributos" e apaga o cookie quando recebe Max-Age=0.
export function documentoComCookies() {
  const cookies = new Map<string, string>();
  const gravados: string[] = [];
  return {
    gravados,
    get cookie() {
      return [...cookies].map(([nome, valor]) => `${nome}=${valor}`).join("; ");
    },
    set cookie(texto: string) {
      gravados.push(texto);
      const [par, ...atributos] = texto.split("; ");
      const i = par.indexOf("=");
      if (atributos.includes("Max-Age=0")) cookies.delete(par.slice(0, i));
      else cookies.set(par.slice(0, i), par.slice(i + 1));
    },
  };
}
