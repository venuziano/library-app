export class EmailDeliveryFailedError extends Error {
  constructor(
    public readonly emailType: string,
    public readonly recipient: string,
    public readonly reason: string,
  ) {
    super(`Failed to send ${emailType} email to ${recipient}: ${reason}`);
  }
}
