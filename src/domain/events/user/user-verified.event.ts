export class UserEmailVerified {
  constructor(
    public readonly userId: number,
    public readonly email: string,
    public readonly username: string,
  ) {}
}
