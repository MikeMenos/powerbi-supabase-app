import * as React from "react";

import { cn } from "@/lib/utils";

export function Checkbox({
  className,
  type,
  ...props
}: React.ComponentProps<"input">) {
  return (
    <input
      type={type ?? "checkbox"}
      className={cn(
        "size-4 rounded border border-input accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
