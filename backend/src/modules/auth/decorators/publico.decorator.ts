import { SetMetadata } from '@nestjs/common';

export const PUBLICO_KEY = 'publico';

// O JwtAuthGuard é global: toda rota exige token, exceto as marcadas aqui.
export const Publico = () => SetMetadata(PUBLICO_KEY, true);
