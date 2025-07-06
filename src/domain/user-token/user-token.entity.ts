import { TokenType } from './token-type.enum';

export class UserToken {
  private constructor(
    public readonly id: number | undefined,
    public userId: number,
    public tokenType: TokenType,
    public code: string,
    public expiresAt: Date,
    public verifiedAt: Date | undefined,
    public consumedAt: Date | undefined,
    public createdAt: Date | undefined,
  ) {}

  static create(properties: {
    userId: number;
    tokenType: TokenType;
    code: string;
  }): UserToken {
    if (!properties.userId) {
      throw new Error('userId is required');
    }
    if (!properties.tokenType) {
      throw new Error('tokenType is required');
    }
    if (!properties.code) {
      throw new Error('code is required');
    }

    const expiresAt = UserToken.calculateExpirationDate(properties.tokenType);

    return new UserToken(
      undefined,
      properties.userId,
      properties.tokenType,
      properties.code,
      expiresAt,
      undefined,
      undefined,
      undefined,
    );
  }

  private static calculateExpirationDate(tokenType: TokenType): Date {
    const now = new Date();

    switch (tokenType) {
      case TokenType.EMAIL_VERIFICATION:
        // 24 hours for email verification
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);
      case TokenType.PASSWORD_RESET:
        // 1 hour for password reset
        return new Date(now.getTime() + 60 * 60 * 1000);
      default:
        // Default to 1 hour for unknown token types
        return new Date(now.getTime() + 60 * 60 * 1000);
    }
  }

  verify(): void {
    if (this.verifiedAt) {
      throw new Error(`Token with id ${this.id} is already verified`);
    }
    if (this.consumedAt) {
      throw new Error(`Token with id ${this.id} is already consumed`);
    }
    if (this.expiresAt < new Date()) {
      throw new Error(`Token with id ${this.id} has expired`);
    }
    this.verifiedAt = new Date();
  }

  consume(): void {
    if (this.consumedAt) {
      throw new Error(`Token with id ${this.id} is already consumed`);
    }
    if (this.expiresAt < new Date()) {
      throw new Error(`Token with id ${this.id} has expired`);
    }
    this.consumedAt = new Date();
  }

  isExpired(): boolean {
    return this.expiresAt < new Date();
  }

  isVerified(): boolean {
    return this.verifiedAt !== undefined;
  }

  isConsumed(): boolean {
    return this.consumedAt !== undefined;
  }

  static reconstitute(properties: {
    id: number;
    userId: number;
    tokenType: TokenType;
    code: string;
    expiresAt: Date;
    verifiedAt?: Date;
    consumedAt?: Date;
    createdAt: Date;
  }): UserToken {
    return new UserToken(
      properties.id,
      properties.userId,
      properties.tokenType,
      properties.code,
      properties.expiresAt,
      properties.verifiedAt,
      properties.consumedAt,
      properties.createdAt,
    );
  }
}
