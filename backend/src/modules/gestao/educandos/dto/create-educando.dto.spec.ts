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
