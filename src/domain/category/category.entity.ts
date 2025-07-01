export class Category {
  private constructor(
    public readonly id: number | undefined,
    public name: string,
    public createdAt: Date | undefined,
    public updatedAt: Date | undefined,
    public deletedAt?: Date,
  ) {}

  static create(properties: { name: string }): Category {
    return new Category(undefined, properties.name, undefined, undefined);
  }

  update(name: string) {
    if (!name) {
      throw new Error('name cannot be empty');
    }
    this.name = name;
    this.updatedAt = new Date();
  }

  patch(props: { name?: string }) {
    if (props.name !== undefined) this.name = props.name;
    this.updatedAt = new Date();
  }

  delete(): void {
    if (this.id === undefined) {
      throw new Error('Cannot delete an Category that has not been persisted');
    }
    if (this.deletedAt) {
      throw new Error(`Category with id ${this.id} is already deleted`);
    }
    const now = new Date();
    this.deletedAt = now;
    this.updatedAt = now;
  }

  // rehydrating from persistence
  static reconstitute(properties: {
    id: number;
    name: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
  }): Category {
    return new Category(
      properties.id,
      properties.name,
      properties.createdAt,
      properties.updatedAt,
      properties.deletedAt,
    );
  }
}
