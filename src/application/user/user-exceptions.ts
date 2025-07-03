export const userNotFoundException = (customMessage?: string): string =>
  customMessage ?? `User not found`;

export const failedToDeleteUserException = (customMessage?: string): string =>
  customMessage ?? `Failed to delete user`;
