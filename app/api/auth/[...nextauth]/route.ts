import type { NextRequest } from "next/server";

import { toErrorResponse } from "@/lib/api/response";
import { handlers } from "@/lib/auth";
import {
  attemptKey,
  clientAddress,
  consumeAttempt,
} from "@/lib/services/rate-limit";

export const { GET } = handlers;

export function POST(request: NextRequest) {
  if (request.nextUrl.pathname.endsWith("/callback/credentials")) {
    try {
      consumeAttempt(attemptKey("login", clientAddress(request.headers)));
    } catch (error) {
      return toErrorResponse(error);
    }
  }

  return handlers.POST(request);
}
