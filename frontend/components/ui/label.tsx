"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

// Primitive shadcn — la règle jsx-a11y/label-has-associated-control veut
// vérifier le pairing à la racine, mais ici le `htmlFor` est passé par
// le consumer (cf. usages dans compte/devenir-expert/login-modal). La
// désactiver localement est légitime : c'est un primitive low-level qui
// transmet ses props.
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
