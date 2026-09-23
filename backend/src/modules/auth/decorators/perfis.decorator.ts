import { SetMetadata } from '@nestjs/common';
import { Perfil } from '../perfis.constants';

export const PERFIS_KEY = 'perfis';

export const Perfis = (...perfis: Perfil[]) => SetMetadata(PERFIS_KEY, perfis);
