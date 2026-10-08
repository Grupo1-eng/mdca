import { Global, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LoginThrottlerGuard } from './guards/login-throttler.guard';
import { PerfisGuard } from './guards/perfis.guard';
import { JwtStrategy } from './strategies/jwt.strategy';
import { obterJwtSecret } from './jwt-config';

@Global()
@Module({
  imports: [
    PassportModule,
    // Só vale onde o LoginThrottlerGuard é aplicado (login e register).
    // Limite padrão: 5 requisições por minuto para cada par IP + e-mail.
    // ttl em milissegundos.
    ThrottlerModule.forRootAsync({
      useFactory: () => [
        {
          ttl: Number(process.env.LOGIN_RATE_TTL ?? 60_000),
          limit: Number(process.env.LOGIN_RATE_LIMIT ?? 5),
        },
      ],
    }),
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: obterJwtSecret(),
        signOptions: {
          expiresIn: Number(process.env.JWT_EXPIRES_IN ?? 28800),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    JwtAuthGuard,
    PerfisGuard,
    LoginThrottlerGuard,
    { provide: APP_GUARD, useExisting: JwtAuthGuard },
  ],
  exports: [
    AuthService,
    JwtModule,
    JwtAuthGuard,
    PerfisGuard,
  ],
})
export class AuthModule {}