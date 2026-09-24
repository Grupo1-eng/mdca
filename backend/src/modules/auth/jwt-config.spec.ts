import { obterJwtSecret } from './jwt-config';

describe('obterJwtSecret', () => {
  it('retorna o JWT_SECRET definido no ambiente', () => {
    expect(obterJwtSecret({ JWT_SECRET: 'segredo-de-teste' })).toBe('segredo-de-teste');
  });

  it('falha quando JWT_SECRET não está definido, em vez de usar uma chave padrão', () => {
    expect(() => obterJwtSecret({})).toThrow(/JWT_SECRET/);
  });

  it('falha quando JWT_SECRET está vazio', () => {
    expect(() => obterJwtSecret({ JWT_SECRET: '   ' })).toThrow(/JWT_SECRET/);
  });
});
