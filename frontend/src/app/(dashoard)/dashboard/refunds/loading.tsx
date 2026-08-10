import { ManagementTablePageSkeleton } from "@/features/management/shared/components/dashboard-loading-skeleton";

export default function RefundsLoading() {
  return (
    <ManagementTablePageSkeleton
      columns={5}
      filterCount={1}
      showFormPanel
    />
  );
}
