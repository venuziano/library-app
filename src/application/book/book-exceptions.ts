export const bookNotFoundException = (customMessage?: string): string =>
  customMessage ?? `Book not found`;

export const failedToDeleteBookException = (customMessage?: string): string =>
  customMessage ?? `Failed to delete book`;

export const bookValidationException = (customMessage?: string): string =>
  customMessage ??
  `Book validation failed: must have a category and at least one author`;
