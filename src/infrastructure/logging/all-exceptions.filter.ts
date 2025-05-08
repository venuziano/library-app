import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  LoggerService,
  Inject,
} from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctxType = host.getType<'graphql' | 'http'>();
    let message: string, stack: string;
    if (exception instanceof Error) {
      message = exception.message;
      stack = exception.stack ?? '';
    } else {
      message = 'Unknown exception';
      stack = '';
    }
    this.logger.error(
      `[${ctxType.toUpperCase()}] ${message}`,
      stack,
      AllExceptionsFilter.name,
    );
    throw exception;
  }
}
