"use client";

import { useEffect, useRef } from "react";

import { usePathname } from "@/i18n/navigation";
import { returnField, scopeField, scriptField } from "@/lib/forms/state";

function FormFallback({ scope }: { scope?: string }) {
  const marker = useRef<HTMLInputElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (marker.current) {
      marker.current.value = "on";
    }
  }, []);

  return (
    <>
      <input ref={marker} type="hidden" name={scriptField} defaultValue="off" />
      <input type="hidden" name={returnField} value={pathname} />
      {scope ? <input type="hidden" name={scopeField} value={scope} /> : null}
    </>
  );
}

export { FormFallback };
