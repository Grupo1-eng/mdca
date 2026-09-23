import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { PerfisGuard } from './guards/perfis.guard';
import { JwtStrategy } from './strategies/jwt.strategy';

@Global()
@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'troque-esta-chave-no-env',
      signOptions: {
        expiresIn: Number(process.env.JWT_EXPIRES_IN ?? 28800),
      },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    JwtAuthGuard,
    PerfisGuard,
  ],
  exports: [
    AuthService,
    JwtModule,
    JwtAuthGuard,
    PerfisGuard,
  ],
})
export class AuthModule {}
