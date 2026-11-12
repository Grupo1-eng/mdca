import { useEffect, useRef, useState } from "react";
import { campoParaIso, isoParaCampo, mascaraData } from "@/lib/format";

// Campo de data no padrão DD/MM/AAAA. O <input type="date"> nativo mostra a data
// no formato do idioma do navegador (MM/DD/YYYY em inglês) e não aceita outro;
// aqui o texto é nosso e o calendário nativo só é usado para escolher o dia.
//
// `value` e `onChange` usam AAAA-MM-DD, como o <input type="date">, então as
// telas continuam enviando o mesmo formato ao backend. Enquanto a data está
// incompleta ou é inválida, onChange recebe "".
export default function CampoData({ value, onChange, required, className, ariaLabel }: {
  value: string;
  onChange: (iso: string) => void;
  required?: boolean;
  className?: string;
  ariaLabel?: string;
}) {
  const [texto, setTexto] = useState(() => isoParaCampo(value));
  const campoRef = useRef<HTMLInputElement>(null);
  const calendarioRef = useRef<HTMLInputElement>(null);

  // Valor trocado por fora (ex.: "Limpar filtros"): atualiza o texto. Não
  // sobrescreve uma data que a pessoa ainda está digitando.
  useEffect(() => {
    if ((campoParaIso(texto) ?? "") !== value) setTexto(isoParaCampo(value));
  }, [value]);

  const invalido = texto !== "" && campoParaIso(texto) === null;
  useEffect(() => {
    campoRef.current?.setCustomValidity(invalido ? "Informe a data no formato DD/MM/AAAA." : "");
  }, [invalido]);

  const digitar = (bruto: string) => {
    const mascarado = mascaraData(bruto);
    setTexto(mascarado);
    onChange(campoParaIso(mascarado) ?? "");
  };

  const abrirCalendario = () => {
    const calendario = calendarioRef.current;
    if (!calendario) return;
    try {
      calendario.showPicker();
    } catch {
      // Navegadores sem showPicker: a data continua podendo ser digitada.
      campoRef.current?.focus();
    }
  };

  return (
    <div className="relative">
      <input
        ref={campoRef}
        type="text"
        inputMode="numeric"
        placeholder="DD/MM/AAAA"
        aria-label={ariaLabel}
        required={required}
        value={texto}
        onChange={e => digitar(e.target.value)}
        className={`${className ?? ""} pr-8 ${invalido ? "border-red-400" : ""}`}
      />
      <button
        type="button"
        onClick={abrirCalendario}
        tabIndex={-1}
        title="Escolher no calendário"
        className="absolute right-1.5 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded text-[var(--muted-foreground)] hover:text-[#1a3a6b] hover:bg-[var(--muted)] cursor-pointer"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
      </button>
      {/* Só abre o calendário nativo; o texto exibido é o do campo acima. */}
      <input
        ref={calendarioRef}
        type="date"
        tabIndex={-1}
        aria-hidden="true"
        value={campoParaIso(texto) ?? ""}
        onChange={e => {
          setTexto(isoParaCampo(e.target.value));
          onChange(e.target.value);
        }}
        className="absolute left-0 bottom-0 w-0 h-0 opacity-0 pointer-events-none"
      />
    </div>
  );
}
