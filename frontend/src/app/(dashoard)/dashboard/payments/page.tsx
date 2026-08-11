import {
  paymentProviderSchema,
  paymentWebhookEventStatusSchema,
} from "@cartura/contracts/payments";

import { listManagementWebhookEvents } from "@/features/management/payments/api/payments-api";
import { PaymentWebhookEventsTable } from "@/features/management/payments/components/payment-webhook-events-table";
import { PageHeader } from "@/features/management/shared/components/admin-ui";
import { ManagementFilters } from "@/features/management/shared/components/management-filters";
import { requireManagementRouteAccess } from "@/features/management/shared/lib/require-management-access";
import { PaginationControls } from "@/shared/ui/pagination-controls";
import {
  getManagementPage,
  getManagementFilter,
  type ManagementSearchParams,
} from "@/features/management/shared/lib/management-search-params";

const PAYMENT_EVENTS_PAGE_SIZE = 30;

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: ManagementSearchParams;
}) {
  const params = await searchParams;
  const status = paymentWebhookEventStatusSchema
    .optional()
    .catch(undefined)
    .parse(getManagementFilter(params.status));
  const provider = paymentProviderSchema
    .optional()
    .catch(undefined)
    .parse(getManagementFilter(params.provider));
  const permissionNames =
    await requireManagementRouteAccess("/dashboard/payments");
  const events = await listManagementWebhookEvents({
      page: getManagementPage(params.page),
      limit: PAYMENT_EVENTS_PAGE_SIZE,
      status,
      provider,
    });

  return (
    <div className="space-y-5">
      <PageHeader
        title="Payments"
        description="Monitor Paymob webhook events, processing state, retry attempts, and manual-review signals."
      />
      <ManagementFilters
        action="/dashboard/payments"
        selects={[
          {
            name: "status",
            label: "statuses",
            value: status,
            options: [
              "received",
              "processed",
              "failed",
              "manual_review",
            ].map((value) => ({
              label: value.replaceAll("_", " "),
              value,
            })),
          },
          {
            name: "provider",
            label: "providers",
            value: provider,
            options: [{ label: "Paymob", value: "paymob" }],
          },
        ]}
      />
      <PaymentWebhookEventsTable
        events={events.data}
        canReprocessEvents={permissionNames.includes(
          "payments.webhooks.reprocess",
        )}
      />
      <PaginationControls pagination={events.pagination} />
    </div>
  );
}
