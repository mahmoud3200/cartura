export type CategoryOptionAncestor = {
  id: string;
  name: string;
  slug: string;
};

export type CategoryOption = {
  id: string;
  name: string;
  slug: string;
  parentCategoryId?: string | null;
  description: string;
  imageUrl: string | null;
  ancestors: CategoryOptionAncestor[];
};

export type CategorySelectOption = CategoryOption & {
  value: string;
  label: string;
};

export type SelectedCategorySeed = {
  id: string;
  name: string;
  slug: string;
  parentCategoryId?: string | null;
};
