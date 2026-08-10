import { ManagementTablePageSkeleton } from "@/features/management/shared/components/dashboard-loading-skeleton";

export default function AuditLoading() {
  return <ManagementTablePageSkeleton columns={4} filterCount={3} rows={8} />;
}
