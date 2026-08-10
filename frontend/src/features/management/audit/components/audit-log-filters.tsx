"use client";

import { Search } from "lucide-react";
import { useState } from "react";

import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import {
  Select,
  SelectItem,
  SelectList,
  SelectPopup,
  SelectPortal,
  SelectPositioner,
  SelectTrigger,
} from "@/shared/ui/select";
import {
  auditActorTypeOptions,
  auditResourceOptions,
  getAuditActionsForResource,
} from "../lib/audit-actions";

const ALL_VALUE = "all";

type AuditLogFiltersProps = {
  action?: string;
  actorType?: string;
  query?: string;
  resourceType?: string;
};

export function AuditLogFilters({
  action,
  actorType,
  query,
  resourceType,
}: AuditLogFiltersProps) {
  const [queryValue, setQueryValue] = useState(query ?? "");
  const [selectedResource, setSelectedResource] = useState(
    resourceType ?? ALL_VALUE,
  );
  const [selectedAction, setSelectedAction] = useState(action ?? ALL_VALUE);
  const [selectedActorType, setSelectedActorType] = useState(
    actorType ?? ALL_VALUE,
  );

  const availableActions = getAuditActionsForResource(selectedResource);
  const resourceLabel =
    auditResourceOptions.find((option) => option.value === selectedResource)
      ?.label ?? "All areas";
  const actionLabel =
    selectedResource === ALL_VALUE
      ? "Select an area first"
      : availableActions.find((option) => option.value === selectedAction)
          ?.label ?? "All actions";
  const actorTypeLabel =
    auditActorTypeOptions.find((option) => option.value === selectedActorType)
      ?.label ?? "All actor types";

  return (
    <form
      action="/dashboard/audit"
      className="grid gap-3 rounded-xl border border-border bg-card p-4 md:grid-cols-2 xl:grid-cols-[minmax(15rem,1.4fr)_repeat(3,minmax(10rem,0.75fr))_auto]"
    >
      <div className="relative min-w-0">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          name="q"
          value={queryValue}
          onChange={(event) => setQueryValue(event.target.value)}
          placeholder="Search actor name or email"
          aria-label="Search actor name or email"
          className="h-9 pl-8"
        />
      </div>

      <Select
        name="resourceType"
        value={selectedResource}
        onValueChange={(nextValue) => {
          if (!nextValue) return;

          setSelectedResource(nextValue);
          setSelectedAction(ALL_VALUE);
        }}
      >
        <SelectTrigger className="h-9" aria-label="Audit area">
          <span className="truncate">{resourceLabel}</span>
        </SelectTrigger>
        <SelectPortal>
          <SelectPositioner>
            <SelectPopup>
              <SelectList>
                <SelectItem value={ALL_VALUE}>All areas</SelectItem>
                {auditResourceOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectList>
            </SelectPopup>
          </SelectPositioner>
        </SelectPortal>
      </Select>

      <Select
        name="action"
        value={selectedAction}
        disabled={selectedResource === ALL_VALUE}
        onValueChange={(nextValue) => {
          if (nextValue) setSelectedAction(nextValue);
        }}
      >
        <SelectTrigger className="h-9" aria-label="Audit action">
          <span className="truncate">{actionLabel}</span>
        </SelectTrigger>
        <SelectPortal>
          <SelectPositioner>
            <SelectPopup>
              <SelectList>
                <SelectItem value={ALL_VALUE}>All actions</SelectItem>
                {availableActions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectList>
            </SelectPopup>
          </SelectPositioner>
        </SelectPortal>
      </Select>

      <Select
        name="actorType"
        value={selectedActorType}
        onValueChange={(nextValue) => {
          if (nextValue) setSelectedActorType(nextValue);
        }}
      >
        <SelectTrigger className="h-9" aria-label="Actor type">
          <span className="truncate">{actorTypeLabel}</span>
        </SelectTrigger>
        <SelectPortal>
          <SelectPositioner>
            <SelectPopup>
              <SelectList>
                <SelectItem value={ALL_VALUE}>All actor types</SelectItem>
                {auditActorTypeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectList>
            </SelectPopup>
          </SelectPositioner>
        </SelectPortal>
      </Select>

      <Button type="submit" className="h-9 px-4 md:col-span-2 xl:col-span-1">
        Apply
      </Button>
    </form>
  );
}
