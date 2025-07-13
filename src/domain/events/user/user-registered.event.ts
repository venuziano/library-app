export class UserRegistered {
  constructor(
    public readonly userId: number,
    public readonly email: string,
    public readonly username: string,
    public readonly verificationCode: string,
  ) {}
}
