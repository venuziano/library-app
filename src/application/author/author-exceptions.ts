export const authorNotFoundException = (customMessage?: string): string =>
  customMessage ?? `Author not found`;

export const failedToDeleteAuthorException = (customMessage?: string): string =>
  customMessage ?? `Failed to delete author`;
