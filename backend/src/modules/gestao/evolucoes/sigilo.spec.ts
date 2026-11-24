import {
  aplicarSigiloEncaminhamento,
  aplicarSigiloEvolucao,
  podeVerConteudo,
} from './sigilo';

// MDCA, perguntas 24 e 25: evolução sigilosa só para os técnicos do serviço
// de quem registrou. Quem registrou e a coordenação sempre veem.
describe('sigilo das evoluções', () => {
  const AUTOR_SS = 10;
  const sigilosaDoSS = {
    sigiloso: true,
    profissionalId: AUTOR_SS,
    profissional: { perfil: 'tecnico_servico_social' },
  };

  const coordenacao = { id: 1, perfil: 'coordenador' };
  const outroSS = { id: 11, perfil: 'tecnico_servico_social' };
  const psicologia = { id: 12, perfil: 'tecnico_psicologia' };

  describe('podeVerConteudo', () => {
    it('evolução não sigilosa: todos veem', () => {
      expect(
        podeVerConteudo({ ...sigilosaDoSS, sigiloso: false }, psicologia),
      ).toBe(true);
    });

    it('quem registrou vê a própria sigilosa', () => {
      expect(
        podeVerConteudo(sigilosaDoSS, { id: AUTOR_SS, perfil: 'tecnico_servico_social' }),
      ).toBe(true);
    });

    it('técnico do mesmo serviço vê', () => {
      expect(podeVerConteudo(sigilosaDoSS, outroSS)).toBe(true);
    });

    it('técnico de outro serviço não vê', () => {
      expect(podeVerConteudo(sigilosaDoSS, psicologia)).toBe(false);
      expect(
        podeVerConteudo(
          { sigiloso: true, profissionalId: 20, profissional: { perfil: 'tecnico_psicologia' } },
          outroSS,
        ),
      ).toBe(false);
    });

    it('a coordenação vê as sigilosas de qualquer serviço', () => {
      expect(podeVerConteudo(sigilosaDoSS, coordenacao)).toBe(true);
    });

    it('sigilosa registrada pela coordenação: técnicos não veem', () => {
      const daCoordenacao = {
        sigiloso: true,
        profissionalId: 1,
        profissional: { perfil: 'coordenador' },
      };
      expect(podeVerConteudo(daCoordenacao, outroSS)).toBe(false);
      expect(podeVerConteudo(daCoordenacao, psicologia)).toBe(false);
      expect(podeVerConteudo(daCoordenacao, { id: 2, perfil: 'coordenador' })).toBe(true);
    });

    it('sem o perfil do autor, só quem registrou e a coordenação veem', () => {
      const semPerfil = { sigiloso: true, profissionalId: AUTOR_SS };
      expect(podeVerConteudo(semPerfil, outroSS)).toBe(false);
      expect(podeVerConteudo(semPerfil, coordenacao)).toBe(true);
    });

    it('perfis fora da Gestão técnica não veem', () => {
      expect(podeVerConteudo(sigilosaDoSS, { id: 30, perfil: 'educador' })).toBe(false);
      expect(podeVerConteudo(sigilosaDoSS, { id: 31, perfil: 'administrativo' })).toBe(false);
    });
  });

  describe('aplicarSigiloEvolucao', () => {
    const evolucao = {
      id: 5,
      ...sigilosaDoSS,
      tipo: 'atendimento',
      titulo: 'Título',
      descricao: 'Relato sigiloso',
      intervencaoUsuario: 'Com o usuário',
      intervencaoFamilia: 'Com a família',
      dataInicio: '2026-11-20T13:00:00.000Z',
      encaminhamentos: [
        {
          id: 8,
          descricao: 'Motivo do encaminhamento',
          destino: 'CAPS',
          acompanhamentos: [{ id: 1, situacao: 'pendente', observacao: 'Obs.' }],
        },
      ],
    };

    it('quem pode ver recebe tudo, com conteudoOculto falso', () => {
      const resultado = aplicarSigiloEvolucao(evolucao, outroSS);
      expect(resultado).toEqual({ ...evolucao, conteudoOculto: false });
    });

    it('quem não pode ver recebe a evolução sem o texto', () => {
      const resultado = aplicarSigiloEvolucao(evolucao, psicologia);
      expect(resultado).toMatchObject({
        id: 5,
        tipo: 'atendimento',
        sigiloso: true,
        dataInicio: '2026-11-20T13:00:00.000Z',
        titulo: null,
        descricao: null,
        intervencaoUsuario: null,
        intervencaoFamilia: null,
        conteudoOculto: true,
      });
      expect(resultado.encaminhamentos[0]).toMatchObject({
        id: 8,
        destino: 'CAPS',
        descricao: null,
        conteudoOculto: true,
      });
      expect(resultado.encaminhamentos[0].acompanhamentos?.[0]).toEqual({
        id: 1,
        situacao: 'pendente',
        observacao: null,
      });
    });

    it('não altera o objeto original', () => {
      aplicarSigiloEvolucao(evolucao, psicologia);
      expect(evolucao.descricao).toBe('Relato sigiloso');
    });
  });

  describe('aplicarSigiloEncaminhamento', () => {
    const encaminhamento = {
      id: 8,
      descricao: 'Motivo',
      acompanhamentos: [{ id: 1, observacao: 'Obs.' }],
    };

    it('sem evolução ligada: devolve tudo e tira o campo evolucao', () => {
      const resultado = aplicarSigiloEncaminhamento(
        { ...encaminhamento, evolucao: null },
        psicologia,
      );
      expect(resultado).toEqual({ ...encaminhamento, conteudoOculto: false });
      expect(resultado).not.toHaveProperty('evolucao');
    });

    it('ligado a sigilosa de outro serviço: sem descrição nem observações', () => {
      const resultado = aplicarSigiloEncaminhamento(
        { ...encaminhamento, evolucao: sigilosaDoSS },
        psicologia,
      );
      expect(resultado).toEqual({
        id: 8,
        descricao: null,
        acompanhamentos: [{ id: 1, observacao: null }],
        conteudoOculto: true,
      });
    });

    it('ligado a sigilosa do próprio serviço: devolve tudo', () => {
      const resultado = aplicarSigiloEncaminhamento(
        { ...encaminhamento, evolucao: sigilosaDoSS },
        outroSS,
      );
      expect(resultado.descricao).toBe('Motivo');
      expect(resultado).not.toHaveProperty('evolucao');
    });
  });
});
