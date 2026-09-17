"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

// Primitive shadcn : `htmlFor` est fourni par l'appelant, d'où la
// désactivation locale de jsx-a11y/label-has-associated-control.
function Label({ className, ...props }: React.ComponentProps<"label">) {
  return (
    // eslint-disable-next-line jsx-a11y/label-has-associated-control
    <label
      data-slot="label"
      className={cn(
        "flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export { Label };
