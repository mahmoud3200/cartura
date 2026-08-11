"use client";

import type { PaymentWebhookEvent } from "@cartura/contracts/payments";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { StatusBadge } from "@/features/management/shared/components/admin-ui";
import { ManagementTableActions } from "@/features/management/shared/components/management-table-actions";
import {
  ManagementTable,
  ManagementTableCell,
} from "@/features/management/shared/components/management-table";
import { formatDateTime } from "@/features/management/shared/lib/admin-utils";
import { reprocessWebhookAction } from "../actions/reprocess-webhook.action";

const columns = [
  { label: "Provider" },
  { label: "Event" },
  { label: "Status" },
  { label: "Attempts" },
  { label: "Received" },
  { label: "Action", className: "text-right" },
];

export function PaymentWebhookEventsTable({
  events,
  canReprocessEvents,
}: {
  events: PaymentWebhookEvent[];
  canReprocessEvents: boolean;
}) {
  return (
    <ManagementTable
      items={events}
      columns={columns}
      gridTemplateColumns="0.6fr 1fr 0.7fr 0.45fr 0.9fr 0.7fr"
      getRowKey={(event) => event.id}
      emptyLabel="No payment webhook events have been received yet."
      renderCells={(event) => (
        <>
          <p className="font-mono">{event.provider}</p>
          <ManagementTableCell>
            <p className="truncate font-medium">{event.eventType}</p>
            <p className="truncate text-xs text-muted-foreground">
              {event.failureReason ?? event.providerEventId}
            </p>
          </ManagementTableCell>
          <StatusBadge status={event.status} />
          <p className="font-mono tabular-nums">{event.attempts}</p>
          <p className="text-xs text-muted-foreground">
            {formatDateTime(event.receivedAt)}
          </p>
          <WebhookEventAction
            event={event}
            canReprocess={canReprocessEvents}
          />
        </>
      )}
    />
  );
}

function WebhookEventAction({
  event,
  canReprocess,
}: {
  event: PaymentWebhookEvent;
  canReprocess: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  if (!canReprocess || event.processedAt) {
    return <span aria-hidden="true" />;
  }

  return (
    <ManagementTableActions
      label={`Actions for ${event.eventType}`}
      isPending={isPending}
      actions={[
        {
          label: "Reprocess webhook",
          onSelect: () =>
            startTransition(async () => {
              const result = await reprocessWebhookAction(event.id);

              if (!result.ok) {
                toast.error("Webhook was not reprocessed", {
                  description: result.message,
                });
                return;
              }

              toast.success("Webhook reprocessed");
              router.refresh();
            }),
        },
      ]}
    />
  );
}
