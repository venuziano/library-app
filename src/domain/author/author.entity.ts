export class Author {
  private constructor(
    public readonly id: number | undefined,
    public firstname: string,
    public lastname: string,
    public createdAt: Date | undefined,
    public updatedAt: Date | undefined,
    public deletedAt?: Date,
  ) {}

  static create(properties: { firstname: string; lastname: string }): Author {
    return new Author(
      undefined,
      properties.firstname,
      properties.lastname,
      undefined,
      undefined,
    );
  }

  update(firstname: string, lastname: string) {
    if (!firstname || !lastname) {
      throw new Error('firstname and lastname cannot be empty');
    }
    this.firstname = firstname;
    this.lastname = lastname;
    this.updatedAt = new Date();
  }

  patch(props: { firstname?: string; lastname?: string }) {
    if (props.firstname !== undefined) this.firstname = props.firstname;
    if (props.lastname !== undefined) this.lastname = props.lastname;
    this.updatedAt = new Date();
  }

  delete(): void {
    if (this.id === undefined) {
      throw new Error('Cannot delete an Author that has not been persisted');
    }
    if (this.deletedAt) {
      throw new Error(`Author with id ${this.id} is already deleted`);
    }
    const now = new Date();
    this.deletedAt = now;
    this.updatedAt = now;
  }

  // rehydrating from persistence
  static reconstitute(properties: {
    id: number;
    firstname: string;
    lastname: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
  }): Author {
    return new Author(
      properties.id,
      properties.firstname,
      properties.lastname,
      properties.createdAt,
      properties.updatedAt,
      properties.deletedAt,
    );
  }
}
