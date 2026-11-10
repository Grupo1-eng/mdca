import { type FormEvent, type ReactNode, useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import {
  useEducandosGestao,
  usePermissoesEducandos,
  useSalvarGestao,
} from "../EducandosContext"
import {
  CORES_AUTODECLARADAS,
  MOTIVOS_INGRESSO,
  ORIGENS_ENCAMINHAMENTO,
  duplicidadeDe,
  educandoVazio,
  responsavelVazio,
} from "../model"
import type { Educando, Responsavel } from "../types"
import {
  CAMPOS_AGUARDANDO_MIGRACAO,
  VINCULO_INICIATIVA_PENDENTE,
  ehIdPersistido,
} from "../../api/educandosMapper"
import { carregarIniciativas } from "../../api/projetosFluxo"
import { tipoParaTela, type IniciativaTela } from "../../api/projetosMapper"
import { useRascunho } from "../useRascunho"
import {
  Card,
  Field,
  SaveStatus,
  SensitiveNote,
  inputClass,
  textareaClass,
} from "./EducandoUi"

const primaryButton =
  "inline-flex h-10 items-center justify-center rounded-md bg-[#0f1e3d] px-4 text-sm font-medium text-white transition-colors hover:bg-[#1a3060] disabled:cursor-not-allowed disabled:opacity-50"
// Campos sem coluna no banco até a migration da Sprint 3 ser aplicada.
const pendente = CAMPOS_AGUARDANDO_MIGRACAO
const AVISO_PENDENTE =
  "Ainda não é salvo no servidor: aguardando a migration da Sprint 3."
// Iniciativa e data de ingresso dependem do vínculo com o projeto
// (EducandoProjeto), ainda sem endpoint.
const vinculoPendente = VINCULO_INICIATIVA_PENDENTE
const AVISO_VINCULO =
  "Ainda não é salvo no servidor: o vínculo com a iniciativa entra numa próxima etapa."

function AvisoPendente() {
  return pendente ? (
    <p className="mt-1 text-xs text-[var(--muted-foreground)]">
      {AVISO_PENDENTE}
    </p>
  ) : null
}

const secondaryButton =
  "inline-flex h-10 items-center justify-center rounded-md border border-[var(--border)] bg-white px-4 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--muted)]"

interface SectionProps {
  titulo: string
  children: ReactNode
}

function Section({ titulo, children }: SectionProps) {
  return (
    <Card className="p-5">
      <h2 className="mb-4 text-base font-semibold">{titulo}</h2>
      <div className="grid gap-4 md:grid-cols-2">{children}</div>
    </Card>
  )
}

function TextInput({
  label,
  value,
  onChange,
  disabled,
  required,
  type = "text",
  placeholder,
  error,
  full,
  min,
}: {
  label: string
  value: string | number
  onChange?: (value: string) => void
  disabled?: boolean
  required?: boolean
  type?: string
  placeholder?: string
  error?: string
  full?: boolean
  min?: number
}) {
  return (
    <Field label={label} full={full}>
      <input
        className={inputClass}
        type={type}
        min={min}
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
        disabled={disabled}
        required={required}
        placeholder={placeholder}
        aria-invalid={!!error}
        aria-describedby={error ? `${label}-erro` : undefined}
      />
      {error && (
        <p id={`${label}-erro`} className="mt-1 text-xs text-red-600">
          {error}
        </p>
      )}
    </Field>
  )
}

export default function EducandoForm({
  educando,
  leitura = false,
}: {
  educando?: Educando
  leitura?: boolean
}) {
  const navigate = useNavigate()
  const { educandos, salvarEducando } = useEducandosGestao()
  const permissoes = usePermissoesEducandos()
  const { estado, mensagem, salvar } = useSalvarGestao()
  const [iniciativasReais, setIniciativasReais] = useState<IniciativaTela[]>([])
  const [form, setForm, limparRascunho] = useRascunho<Educando>(
    `rascunho:gestao:educando:${educando?.id ?? "novo"}`,
    educando ?? educandoVazio(),
  )

  const set = <K extends keyof Educando>(campo: K, valor: Educando[K]) =>
    setForm((atual) => ({ ...atual, [campo]: valor }))

  useEffect(() => {
    let ativo = true
    carregarIniciativas()
      .then((resultado) => {
        if (ativo) setIniciativasReais(resultado.iniciativas)
      })
      .catch(() => {
        if (ativo) setIniciativasReais([])
      })
    return () => {
      ativo = false
    }
  }, [])

  const atualizarResponsavel = (
    id: string,
    campo: keyof Responsavel,
    valor: string,
  ) =>
    setForm((atual) => ({
      ...atual,
      responsaveis: atual.responsaveis.map((responsavel) =>
        responsavel.id === id
          ? { ...responsavel, [campo]: valor }
          : responsavel,
      ),
    }))

  const duplicidade = duplicidadeDe(educandos, form)
  const erroDuplicidade = duplicidade
    ? `Este ${duplicidade.campo.toUpperCase()} já pertence a ${duplicidade.educando.nome}.`
    : undefined

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (leitura || duplicidade) return

    let salvo: Educando | undefined
    const ok = await salvar(async () => {
      salvo = await salvarEducando(form)
    })
    if (ok && salvo) {
      limparRascunho()
      navigate(`/gestao/educandos/${salvo.id}`)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {duplicidade && !leitura && (
        <SensitiveNote>
          <strong>Cadastro bloqueado.</strong> {erroDuplicidade} O formulário
          foi mantido para correção.
        </SensitiveNote>
      )}
      {mensagem && <SensitiveNote>{mensagem}</SensitiveNote>}

      <Section titulo="Dados pessoais">
        <TextInput
          label="Nome completo"
          value={form.nome}
          onChange={(value) => set("nome", value)}
          required
          disabled={leitura}
          full
        />
        <TextInput
          label="Data de nascimento"
          type="date"
          value={form.nascimento}
          onChange={(value) => set("nascimento", value)}
          disabled={leitura}
        />
        <div>
          <TextInput
            label="Gênero"
            value={form.genero}
            onChange={(value) => set("genero", value)}
            disabled={leitura || pendente}
          />
          <AvisoPendente />
        </div>
        <Field label="Cor autodeclarada">
          <select
            className={inputClass}
            value={form.corAutodeclarada}
            onChange={(event) => set("corAutodeclarada", event.target.value)}
            disabled={leitura}
          >
            <option value="">Selecione</option>
            {CORES_AUTODECLARADAS.map((cor) => (
              <option key={cor} value={cor}>
                {cor}
              </option>
            ))}
          </select>
        </Field>
        <TextInput
          label="CPF"
          value={form.cpf}
          onChange={(value) => set("cpf", value)}
          placeholder="000.000.000-00"
          error={duplicidade?.campo === "cpf" ? erroDuplicidade : undefined}
          disabled={leitura}
        />
        <TextInput
          label="NIS"
          value={form.nis}
          onChange={(value) => set("nis", value)}
          error={duplicidade?.campo === "nis" ? erroDuplicidade : undefined}
          disabled={leitura}
        />
        <TextInput
          label="RG"
          value={form.rg}
          onChange={(value) => set("rg", value)}
          disabled={leitura}
        />
        <TextInput
          label="Endereço"
          value={form.endereco}
          onChange={(value) => set("endereco", value)}
          disabled={leitura}
          full
        />
        <TextInput
          label="Telefone de contato"
          value={form.telefone}
          onChange={(value) => set("telefone", value)}
          disabled={leitura}
        />
      </Section>

      <Section titulo="Vínculo institucional">
        <Field label="Iniciativa vinculada (Projeto / Serviço / Programa)" full>
          <select
            className={inputClass}
            value={form.iniciativaId}
            onChange={(event) => set("iniciativaId", event.target.value)}
            disabled={leitura || vinculoPendente}
          >
            <option value="">Selecione a iniciativa</option>
            {iniciativasReais.map((iniciativa) => (
              <option key={iniciativa.id} value={iniciativa.id}>
                {iniciativa.nome} ({tipoParaTela(iniciativa.tipo)})
              </option>
            ))}
          </select>
          {vinculoPendente && (
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">
              {AVISO_VINCULO}
            </p>
          )}
        </Field>
        <TextInput
          label="Data de ingresso"
          type="date"
          value={form.dataIngresso}
          onChange={(value) => set("dataIngresso", value)}
          disabled={leitura || vinculoPendente}
        />
        <TextInput
          label="Situação do vínculo"
          value={form.situacaoVinculo}
          disabled
        />
      </Section>

      <Section titulo="Dados escolares">
        <TextInput
          label="Escola"
          value={form.escola}
          onChange={(value) => set("escola", value)}
          disabled={leitura}
        />
        <div>
          <TextInput
            label="Série / ano"
            value={form.serie}
            onChange={(value) => set("serie", value)}
            disabled={leitura || pendente}
          />
          <AvisoPendente />
        </div>
        <TextInput
          label="Turno"
          value={form.turno}
          onChange={(value) => set("turno", value)}
          disabled={leitura}
        />
        <TextInput
          label="Histórico de repetência"
          value={form.repetencia}
          onChange={(value) => set("repetencia", value)}
          disabled={leitura}
          full
        />
      </Section>

      <Card className="space-y-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold">Responsáveis familiares</h2>
          {!leitura && (
            <button
              type="button"
              className={secondaryButton}
              onClick={() =>
                set("responsaveis", [...form.responsaveis, responsavelVazio()])
              }
            >
              + Adicionar responsável
            </button>
          )}
        </div>

        {form.responsaveis.map((responsavel, indice) => (
          <div
            key={responsavel.id || indice}
            className="grid gap-4 rounded-lg border border-[var(--border)] p-4 md:grid-cols-2"
          >
            {([
              ["Nome", "nome"],
              ["Vínculo", "vinculo"],
              ["CPF", "cpf"],
              ["RG", "rg"],
              ["Telefone", "telefone"],
              ["Profissão", "profissao"],
              ["Tipo de trabalho", "tipoTrabalho"],
              ["Local de trabalho", "localTrabalho"],
              ["Escolaridade", "escolaridade"],
            ] as const).map(([label, campo]) => (
              <TextInput
                key={campo}
                label={label}
                value={responsavel[campo]}
                onChange={(value) =>
                  atualizarResponsavel(responsavel.id, campo, value)
                }
                disabled={leitura}
                full={campo === "escolaridade"}
              />
            ))}
            {!leitura && !ehIdPersistido(responsavel.id) && (
              <div className="md:col-span-2">
                <button
                  type="button"
                  className="text-sm text-red-600 hover:underline"
                  onClick={() =>
                    set(
                      "responsaveis",
                      form.responsaveis.filter(
                        (item) => item.id !== responsavel.id,
                      ),
                    )
                  }
                >
                  Remover responsável
                </button>
              </div>
            )}
          </div>
        ))}
      </Card>

      <Section titulo="Situação socioeconômica">
        <TextInput
          label="Renda familiar"
          value={form.rendaFamiliar}
          onChange={(value) => set("rendaFamiliar", value)}
          disabled={leitura}
        />
        <TextInput
          label="Pessoas na residência"
          type="number"
          min={1}
          value={form.pessoasCasa}
          onChange={(value) => set("pessoasCasa", Number(value))}
          disabled={leitura}
        />
        <TextInput
          label="Benefícios recebidos"
          value={form.beneficios}
          onChange={(value) => set("beneficios", value)}
          disabled={leitura}
        />
        <TextInput
          label="Tipo de moradia"
          value={form.moradia}
          onChange={(value) => set("moradia", value)}
          disabled={leitura}
        />
      </Section>

      <Card className="p-5">
        <h2 className="mb-3 text-base font-semibold">
          Saúde (informação sensível)
        </h2>
        {permissoes.verSaude ? (
          <div className="grid gap-4 md:grid-cols-2">
            {!leitura && (
              <div className="md:col-span-2">
                <SensitiveNote>
                  Campos de acesso restrito: visíveis apenas para Coordenação e
                  equipe técnica.
                </SensitiveNote>
              </div>
            )}
            <TextInput
              label="Doença crônica"
              value={form.doencaCronica}
              onChange={(value) => set("doencaCronica", value)}
              disabled={leitura}
            />
            <TextInput
              label="Uso contínuo de medicamento"
              value={form.medicamentoContinuo}
              onChange={(value) => set("medicamentoContinuo", value)}
              disabled={leitura}
            />
            <Field label="Observações" full>
              <textarea
                rows={3}
                className={textareaClass}
                value={form.saudeObs}
                onChange={(event) => set("saudeObs", event.target.value)}
                disabled={leitura}
              />
            </Field>
          </div>
        ) : (
          <SensitiveNote>
            Conteúdo restrito — seu perfil atual não tem permissão para
            visualizar ou editar as informações de saúde.
          </SensitiveNote>
        )}
      </Card>

      <Card className="p-5">
        <h2 className="mb-4 text-base font-semibold">
          Ingresso e encaminhamento
        </h2>
        {pendente && (
          <div className="mb-3">
            <SensitiveNote>{AVISO_PENDENTE}</SensitiveNote>
          </div>
        )}
        <p className="mb-2 text-xs font-medium text-[var(--muted-foreground)]">
          Motivo de ingresso (múltipla escolha)
        </p>
        <div className="grid gap-2 md:grid-cols-2">
          {MOTIVOS_INGRESSO.map((motivo) => (
            <label key={motivo} className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                className="mt-0.5 size-4 accent-[#0e7e6e]"
                checked={form.motivosIngresso.includes(motivo)}
                disabled={leitura || pendente}
                onChange={(event) =>
                  set(
                    "motivosIngresso",
                    event.target.checked
                      ? [...form.motivosIngresso, motivo]
                      : form.motivosIngresso.filter((item) => item !== motivo),
                  )
                }
              />
              {motivo}
            </label>
          ))}
        </div>
        <div className="mt-4 max-w-md">
          <Field label="Origem do encaminhamento">
            <select
              className={inputClass}
              value={form.origemEncaminhamento}
              onChange={(event) =>
                set("origemEncaminhamento", event.target.value)
              }
              disabled={leitura || pendente}
            >
              <option value="">Selecione a origem</option>
              {ORIGENS_ENCAMINHAMENTO.map((origem) => (
                <option key={origem} value={origem}>
                  {origem}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </Card>

      {!leitura && (
        <div className="flex flex-wrap items-center gap-4">
          <button
            type="submit"
            className={primaryButton}
            disabled={estado === "saving" || !!duplicidade}
          >
            {educando ? "Salvar alterações" : "Cadastrar educando"}
          </button>
          <Link to="/gestao/educandos" className={secondaryButton}>
            Cancelar
          </Link>
          <SaveStatus estado={estado} />
        </div>
      )}
    </form>
  )
}
