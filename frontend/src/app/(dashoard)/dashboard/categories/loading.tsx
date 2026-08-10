import { ManagementTablePageSkeleton } from "@/features/management/shared/components/dashboard-loading-skeleton";

export default function CategoriesLoading() {
  return <ManagementTablePageSkeleton columns={5} filterCount={0} />;
}
