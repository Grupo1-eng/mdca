import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Publico } from './decorators/publico.decorator';
import {
  UsuarioAtual,
  UsuarioAutenticado,
} from './decorators/usuario-atual.decorator';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Publico()
  @UseGuards(ThrottlerGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dados: LoginDto) {
    return this.authService.login(dados);
  }

  // Mesmo formato do `usuario` devolvido no login.
  @Get('me')
  me(@UsuarioAtual() usuario: UsuarioAutenticado) {
    return {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      perfil: usuario.perfil,
    };
  }
}
