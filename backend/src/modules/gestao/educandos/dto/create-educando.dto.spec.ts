import 'reflect-metadata';

import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { CreateResponsavelFamiliarDto } from '../../responsaveis-familiares/dto/create-responsavel-familiar.dto';
import { CreateEducandoDto } from './create-educando.dto';

async function errosDeCpf(classe: any, base: object, cpf: unknown) {
  const erros = await validate(plainToInstance(classe, { ...base, cpf }));
  return erros.filter((erro) => erro.property === 'cpf');
}

describe('CPF nos DTOs da Gestão', () => {
  const casos: [string, any, object][] = [
    ['educando', CreateEducandoDto, { nome: 'Ana' }],
    ['responsável', CreateResponsavelFamiliarDto, { educandoId: 1, nome: 'Rosa', vinculo: 'Mãe' }],
  ];

  it.each(casos)('%s: aceita 11 dígitos, vazio ou null', async (_n, classe, base) => {
    expect(await errosDeCpf(classe, base, '12345678910')).toHaveLength(0);
    expect(await errosDeCpf(classe, base, null)).toHaveLength(0);
    expect(await errosDeCpf(classe, base, undefined)).toHaveLength(0);
  });

  it.each(casos)('%s: recusa CPF com mais ou menos dígitos, ou com máscara', async (_n, classe, base) => {
    for (const cpf of ['123', '123456789101234', '123.456.789-10']) {
      expect(await errosDeCpf(classe, base, cpf)).toHaveLength(1);
    }
  });
});

// Questionário da MDCA, pergunta 24: autorização de uso de imagem e voz.
describe('Autorização de uso de imagem no DTO do educando', () => {
  async function erros(dados: object) {
    return validate(plainToInstance(CreateEducandoDto, { nome: 'Ana', ...dados }));
  }

  it('aceita sim, não ou não informado (null/ausente), com data', async () => {
    expect(await erros({ autorizacaoImagem: true, autorizacaoImagemData: '2026-03-10' })).toHaveLength(0);
    expect(await erros({ autorizacaoImagem: false })).toHaveLength(0);
    expect(await erros({ autorizacaoImagem: null, autorizacaoImagemData: null })).toHaveLength(0);
    expect(await erros({})).toHaveLength(0);
  });

  it('converte a data e recusa valores inválidos', async () => {
    const dto = plainToInstance(CreateEducandoDto, { nome: 'Ana', autorizacaoImagemData: '2026-03-10' });
    expect(dto.autorizacaoImagemData).toBeInstanceOf(Date);

    const [erroBool] = await erros({ autorizacaoImagem: 'talvez' });
    expect(erroBool.property).toBe('autorizacaoImagem');
    const [erroData] = await erros({ autorizacaoImagemData: 'ontem' });
    expect(erroData.property).toBe('autorizacaoImagemData');
  });
});
