import { ManagementTablePageSkeleton } from "@/features/management/shared/components/dashboard-loading-skeleton";

export default function PaymentsLoading() {
  return <ManagementTablePageSkeleton columns={6} filterCount={2} />;
}
