export abstract class EmailGateway {
  abstract enqueueVerification(
    to: string,
    username: string,
    code: string,
  ): Promise<void>;
  abstract enqueueWelcome(to: string, username: string): Promise<void>;
}
