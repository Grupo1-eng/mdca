import { ValidationPipe } from '@nestjs/common';

// Passa o corpo pelo mesmo ValidationPipe configurado em main.ts, para os
// testes de DTO verem exatamente o que o controller receberia.
const pipe = new ValidationPipe({ whitelist: true, transform: true });

export async function validarDto<T>(
  dto: new () => T,
  corpo: Record<string, unknown>,
): Promise<{ valor?: T; erros?: string[] }> {
  try {
    const valor = await pipe.transform(corpo, { type: 'body', metatype: dto });
    return { valor };
  } catch (e: any) {
    return { erros: e.getResponse().message };
  }
}
