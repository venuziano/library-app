export class Book {
  private constructor(
    public readonly id: number | undefined,
    public title: string,
    public publisher: string | undefined,
    public publicationDate: Date | undefined,
    public pageCount: number | undefined,
    public categoryIds: number[],
    public authorIds: number[],
    public createdAt: Date | undefined,
    public updatedAt: Date | undefined,
    public deletedAt?: Date,
  ) {}

  static create(properties: {
    title: string;
    publisher?: string;
    publicationDate?: Date;
    pageCount?: number;
    categoryIds: number[];
    authorIds: number[];
  }): Book {
    if (!properties.categoryIds || properties.categoryIds.length === 0) {
      throw new Error('Book must have at least one category');
    }
    if (!properties.authorIds || properties.authorIds.length === 0) {
      throw new Error('Book must have at least one author');
    }

    return new Book(
      undefined,
      properties.title,
      properties.publisher,
      properties.publicationDate,
      properties.pageCount,
      properties.categoryIds,
      properties.authorIds,
      undefined,
      undefined,
    );
  }

  update(properties: {
    title: string;
    publisher?: string;
    publicationDate?: Date;
    pageCount?: number;
    categoryIds: number[];
    authorIds: number[];
  }) {
    if (!properties.title) {
      throw new Error('title cannot be empty');
    }
    if (!properties.categoryIds || properties.categoryIds.length === 0) {
      throw new Error('Book must have at least one category');
    }
    if (!properties.authorIds || properties.authorIds.length === 0) {
      throw new Error('Book must have at least one author');
    }

    this.title = properties.title;
    this.publisher = properties.publisher;
    this.publicationDate = properties.publicationDate;
    this.pageCount = properties.pageCount;
    this.categoryIds = properties.categoryIds;
    this.authorIds = properties.authorIds;
    this.updatedAt = new Date();
  }

  patch(props: {
    title?: string;
    publisher?: string;
    publicationDate?: Date;
    pageCount?: number;
    categoryIds?: number[];
    authorIds?: number[];
  }) {
    if (props.title !== undefined) this.title = props.title;
    if (props.publisher !== undefined) this.publisher = props.publisher;
    if (props.publicationDate !== undefined)
      this.publicationDate = props.publicationDate;
    if (props.pageCount !== undefined) this.pageCount = props.pageCount;
    if (props.categoryIds !== undefined) this.categoryIds = props.categoryIds;
    if (props.authorIds !== undefined) this.authorIds = props.authorIds;
    this.updatedAt = new Date();
  }

  delete(): void {
    if (this.id === undefined) {
      throw new Error('Cannot delete a Book that has not been persisted');
    }
    if (this.deletedAt) {
      throw new Error(`Book with id ${this.id} is already deleted`);
    }
    const now = new Date();
    this.deletedAt = now;
    this.updatedAt = now;
  }

  // rehydrating from persistence
  static reconstitute(properties: {
    id: number;
    title: string;
    publisher?: string;
    publicationDate?: Date;
    pageCount?: number;
    categoryIds: number[];
    authorIds: number[];
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
  }): Book {
    return new Book(
      properties.id,
      properties.title,
      properties.publisher,
      properties.publicationDate,
      properties.pageCount,
      properties.categoryIds,
      properties.authorIds,
      properties.createdAt,
      properties.updatedAt,
      properties.deletedAt,
    );
  }
}
