const standardGrid = "lg:grid-cols-12 lg:auto-rows-[14rem]";

type CollectionGridLayout = {
  categoryLayouts: string[];
  gridLayout: string;
  showMoreLayout: string;
};

export function getCollectionGridLayout(
  categoryCount: number,
): CollectionGridLayout {
  if (categoryCount === 1) {
    return {
      categoryLayouts: ["lg:col-span-8"],
      gridLayout: standardGrid,
      showMoreLayout: "lg:col-span-4",
    };
  }

  if (categoryCount === 2) {
    return {
      categoryLayouts: ["lg:col-span-7", "lg:col-span-5"],
      gridLayout: standardGrid,
      showMoreLayout: "lg:col-span-12",
    };
  }

  if (categoryCount === 3) {
    return {
      categoryLayouts: [
        "lg:col-span-7 lg:row-span-2",
        "lg:col-span-5",
        "lg:col-span-5",
      ],
      gridLayout: "lg:grid-cols-12 lg:grid-rows-[14rem_14rem_10rem]",
      showMoreLayout: "lg:col-span-12",
    };
  }

  return {
    categoryLayouts: [
      "lg:col-span-7 lg:row-span-2",
      "lg:col-span-5",
      "lg:col-span-5",
      "lg:col-span-8",
    ],
    gridLayout: standardGrid,
    showMoreLayout: "lg:col-span-4",
  };
}
