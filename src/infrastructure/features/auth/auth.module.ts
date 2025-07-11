import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { AuthService } from 'src/application/auth/auth.service';
import { BcryptPasswordHasher } from 'src/domain/auth/auth.entity';
import { AuthResolver } from './graphql/auth.resolver';
import { AppConfigModule } from 'src/infrastructure/config/app-config.module';
import { AppEnvConfigService } from 'src/infrastructure/config/environment-variables/app-env.config';
import { UserModule } from '../user/user.module';
import { UserTokenModule } from '../user-token/user-token.module';
import { MailModule } from 'src/infrastructure/mail/mail.module';
import { UserRegistrationService } from 'src/application/auth/user-register.service';
import { UserVerificationService } from 'src/application/auth/user-verification.service';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [AppConfigModule],
      inject: [AppEnvConfigService],
      useFactory: (config: AppEnvConfigService) => ({
        secret: config.jwtSecret,
        signOptions: { expiresIn: config.jwtExpiresIn },
      }),
    }),
    UserModule,
    UserTokenModule,
    MailModule,
  ],
  providers: [
    AuthService,
    BcryptPasswordHasher,
    AuthResolver,
    UserRegistrationService,
    UserVerificationService,
  ],
  exports: [AuthService],
})
export class AuthModule {}
