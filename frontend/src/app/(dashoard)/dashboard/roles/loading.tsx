import { ManagementTablePageSkeleton } from "@/features/management/shared/components/dashboard-loading-skeleton";

export default function RolesLoading() {
  return <ManagementTablePageSkeleton columns={4} filterCount={0} />;
}
