import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { LoginThrottlerGuard } from './guards/login-throttler.guard';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { Publico } from './decorators/publico.decorator';
import {
  UsuarioAtual,
  UsuarioAutenticado,
} from './decorators/usuario-atual.decorator';

@ApiTags('Autenticação')
@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Autentica o usuário e devolve o token JWT' })
  @ApiResponse({ status: 200, description: 'Login realizado.' })
  @ApiResponse({ status: 401, description: 'E-mail ou senha inválidos.' })
  @ApiResponse({ status: 429, description: 'Muitas tentativas. Aguarde um minuto.' })
  @Publico()
  @UseGuards(LoginThrottlerGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dados: LoginDto) {
    return this.authService.login(dados);
  }

  @ApiOperation({ summary: 'Cadastra um usuário (perfil padrão: administrativo)' })
  @ApiResponse({ status: 201, description: 'Usuário criado; já devolve o token.' })
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  @ApiResponse({ status: 409, description: 'E-mail já cadastrado.' })
  @ApiResponse({ status: 429, description: 'Muitas tentativas. Aguarde um minuto.' })
  @Publico()
  @UseGuards(LoginThrottlerGuard)
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  register(@Body() dados: RegisterDto) {
    return this.authService.register(dados);
  }

  // Mesmo formato do `usuario` devolvido no login.
  @ApiOperation({ summary: 'Devolve os dados do usuário autenticado' })
  @ApiResponse({ status: 200, description: 'Usuário atual.' })
  @ApiResponse({ status: 401, description: 'Token ausente ou inválido.' })
  @ApiBearerAuth('access-token')
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