export const MAIL_PROCESS_TOKEN: string = 'mail';
export const SEND_VERIFICATION_PROCESS_TOKEN: string = 'sendVerification';
export const SEND_WELCOME_PROCESS_TOKEN: string = 'sendWelcome';

export abstract class EmailGateway {
  abstract enqueueVerification(
    to: string,
    username: string,
    code: string,
  ): Promise<void>;
  abstract enqueueWelcome(to: string, username: string): Promise<void>;
}
