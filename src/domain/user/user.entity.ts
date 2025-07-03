export class User {
  private constructor(
    public readonly id: number | undefined,
    public username: string,
    public firstname: string | undefined,
    public lastname: string | undefined,
    public email: string,
    public stripeCustomerId: string | undefined,
    public createdAt: Date | undefined,
    public updatedAt: Date | undefined,
    public deletedAt?: Date,
  ) {}

  static create(properties: {
    username: string;
    firstname?: string;
    lastname?: string;
    email: string;
    stripeCustomerId?: string;
  }): User {
    if (!properties.username) {
      throw new Error('username is required');
    }
    if (!properties.email) {
      throw new Error('email is required');
    }
    return new User(
      undefined,
      properties.username,
      properties.firstname,
      properties.lastname,
      properties.email,
      properties.stripeCustomerId,
      undefined,
      undefined,
    );
  }

  update(properties: {
    username: string;
    firstname?: string;
    lastname?: string;
    email: string;
    stripeCustomerId?: string;
  }) {
    if (!properties.username) {
      throw new Error('username is required');
    }
    if (!properties.email) {
      throw new Error('email is required');
    }
    this.username = properties.username;
    this.firstname = properties.firstname;
    this.lastname = properties.lastname;
    this.email = properties.email;
    this.stripeCustomerId = properties.stripeCustomerId;
    this.updatedAt = new Date();
  }

  patch(props: {
    username?: string;
    firstname?: string;
    lastname?: string;
    email?: string;
    stripeCustomerId?: string;
  }) {
    if (props.username !== undefined) this.username = props.username;
    if (props.firstname !== undefined) this.firstname = props.firstname;
    if (props.lastname !== undefined) this.lastname = props.lastname;
    if (props.email !== undefined) this.email = props.email;
    if (props.stripeCustomerId !== undefined) this.stripeCustomerId = props.stripeCustomerId;
    this.updatedAt = new Date();
  }

  delete(): void {
    if (this.id === undefined) {
      throw new Error('Cannot delete a User that has not been persisted');
    }
    if (this.deletedAt) {
      throw new Error(`User with id ${this.id} is already deleted`);
    }
    const now = new Date();
    this.deletedAt = now;
    this.updatedAt = now;
  }

  static reconstitute(properties: {
    id: number;
    username: string;
    firstname?: string;
    lastname?: string;
    email: string;
    stripeCustomerId?: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
  }): User {
    return new User(
      properties.id,
      properties.username,
      properties.firstname,
      properties.lastname,
      properties.email,
      properties.stripeCustomerId,
      properties.createdAt,
      properties.updatedAt,
      properties.deletedAt,
    );
  }
} 