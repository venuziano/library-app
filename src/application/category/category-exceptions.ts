export const categoryNotFoundException = (customMessage?: string): string =>
  customMessage ?? `Category not found`;

export const failedToDeleteCategoryException = (
  customMessage?: string,
): string => customMessage ?? `Failed to delete category`;
