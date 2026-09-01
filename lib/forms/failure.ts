import type { Locale } from "next-intl";

import { redirect } from "@/i18n/navigation";
import {
  encodeFailure,
  type FormFailure,
  isScripted,
  readScope,
  returnField,
  safeReturnPath,
} from "@/lib/forms/state";

export function formFailure<Code extends string>(
  locale: Locale,
  formData: FormData,
  state: FormFailure<Code>,
): FormFailure<Code> {
  const pathname = safeReturnPath(formData.get(returnField));

  if (isScripted(formData) || !pathname) {
    return state;
  }

  return redirect({
    href: { pathname, query: encodeFailure(state, readScope(formData)) },
    locale,
  });
}
