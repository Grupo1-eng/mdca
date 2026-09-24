import { validarDto } from '../../../../../test/validar-dto';
import { LoginDto } from '../../../auth/dto/login.dto';
import { CreateUsuarioDto } from './create-usuario.dto';
import { UpdateUsuarioDto } from './update-usuario.dto';

const valido = {
  organizacaoId: 1,
  nome: 'Maria da Silva',
  email: 'maria@mdca.org.br',
  senha: 'senha-inicial',
  perfil: 'administrativo',
};

describe('CreateUsuarioDto', () => {
  it('aceita um usuário válido', async () => {
    const { erros } = await validarDto(CreateUsuarioDto, valido);
    expect(erros).toBeUndefined();
  });

  it('guarda o e-mail em minúsculas e sem espaços', async () => {
    const { valor } = await validarDto(CreateUsuarioDto, {
      ...valido,
      email: '  Maria@MDCA.org.br ',
    });
    expect(valor?.email).toBe('maria@mdca.org.br');
  });

  it('recusa e-mail inválido', async () => {
    const { erros } = await validarDto(CreateUsuarioDto, { ...valido, email: 'maria' });
    expect(erros).toEqual(expect.arrayContaining([expect.stringContaining('email')]));
  });

  it('recusa perfil que não existe no sistema', async () => {
    const { erros } = await validarDto(CreateUsuarioDto, { ...valido, perfil: 'COORDENACAO' });
    expect(erros).toEqual(expect.arrayContaining([expect.stringContaining('perfil')]));
  });

  it('descarta criadoEm enviado pelo cliente', async () => {
    const { valor } = await validarDto(CreateUsuarioDto, {
      ...valido,
      criadoEm: '2020-01-01T00:00:00Z',
    });
    expect(valor).not.toHaveProperty('criadoEm');
  });
});

describe('UpdateUsuarioDto', () => {
  it('também normaliza o e-mail', async () => {
    const { valor } = await validarDto(UpdateUsuarioDto, { email: 'Maria@MDCA.org.br' });
    expect(valor?.email).toBe('maria@mdca.org.br');
  });
});

describe('LoginDto', () => {
  it('normaliza o e-mail para achar o usuário mesmo digitado com maiúsculas', async () => {
    const { valor } = await validarDto(LoginDto, { email: ' Maria@MDCA.org.br', senha: 'x' });
    expect(valor?.email).toBe('maria@mdca.org.br');
  });
});
