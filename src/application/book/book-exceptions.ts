export const bookNotFoundException = (customMessage?: string): string =>
  customMessage ?? `Book not found`;

export const failedToDeleteBookException = (customMessage?: string): string =>
  customMessage ?? `Failed to delete book`;
