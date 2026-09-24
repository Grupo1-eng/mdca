import { Global, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { PerfisGuard } from './guards/perfis.guard';
import { JwtStrategy } from './strategies/jwt.strategy';
import { obterJwtSecret } from './jwt-config';

@Global()
@Module({
  imports: [
    PassportModule,
    // Só vale onde o ThrottlerGuard é aplicado (hoje, apenas o login).
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 5 }]),
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
