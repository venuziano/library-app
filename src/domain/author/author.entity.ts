export class Author {
  private constructor(
    public readonly id: number | undefined,
    public firstname: string,
    public lastname: string,
    public createdAt: Date | undefined,
    public updatedAt: Date | undefined,
    public deletedAt?: Date,
  ) {}

  // creating authors
  static create(properties: { firstname: string; lastname: string }): Author {
    return new Author(
      undefined,
      properties.firstname,
      properties.lastname,
      undefined,
      undefined,
    );
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
