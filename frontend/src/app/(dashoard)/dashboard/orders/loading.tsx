import { ManagementTablePageSkeleton } from "@/features/management/shared/components/dashboard-loading-skeleton";

export default function OrdersLoading() {
  return <ManagementTablePageSkeleton columns={6} filterCount={2} />;
}
