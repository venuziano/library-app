// src/infrastructure/logging/logging.module.ts

import { Module, Logger } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import {
  WinstonModule,
  utilities as nestWinstonModuleUtilities,
  WINSTON_MODULE_NEST_PROVIDER,
} from 'nest-winston';

// Use ES-module imports so TS knows winston’s types
import { transports, format } from 'winston';
import { AllExceptionsFilter } from './all-exceptions.filter';

@Module({
  imports: [
    WinstonModule.forRoot({
      transports: [
        new transports.Console({
          format: format.combine(
            format.timestamp(),
            nestWinstonModuleUtilities.format.nestLike(),
          ),
        }),
        // …any other transports (File, HTTP, etc.)
      ],
    }),
  ],
  providers: [
    // 1️⃣ Wire Nest’s Logger to the Winston transport
    {
      provide: Logger,
      useExisting: WINSTON_MODULE_NEST_PROVIDER,
    },
    // 2️⃣ Apply your global exception filter
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
  exports: [Logger],
})
export class LoggingModule {}
