import { Search } from "lucide-react";

import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";

export function SearchFilter({
  action,
  defaultValue,
  placeholder = "Search",
}: {
  action: string;
  defaultValue?: string;
  placeholder?: string;
}) {
  return (
    <form action={action} className="flex w-full max-w-md items-center gap-2">
      <div className="relative min-w-0 flex-1">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          name="q"
          defaultValue={defaultValue}
          placeholder={placeholder}
          className="h-9 rounded-md pl-8"
        />
      </div>
      <Button type="submit" className="h-9 rounded-md px-4">
        Search
      </Button>
    </form>
  );
}
