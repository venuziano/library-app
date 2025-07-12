export interface VerificationJobData {
  to: string;
  username: string;
  code: string;
}

export interface WelcomeJobData {
  to: string;
  username: string;
}

export const MAIL_PROCESS_TOKEN = 'mail';
export const SEND_VERIFICATION_PROCESS_TOKEN = 'sendVerification';
export const SEND_WELCOME_PROCESS_TOKEN = 'sendWelcome';
