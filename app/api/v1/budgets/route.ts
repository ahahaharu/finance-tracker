import { format } from "date-fns";
import type { NextRequest } from "next/server";

import {
  collection,
  created,
  handle,
  malformedBody,
  readJson,
  validationFailure,
} from "@/lib/api/response";
import { requireUser } from "@/lib/auth/guards";
import { budgetQuerySchema, createBudgetSchema } from "@/lib/schemas/budget";
import { buildMeta, DEFAULT_PAGE_SIZE } from "@/lib/schemas/collection";
import { createBudget, listBudgets } from "@/lib/services/budget";

export function GET(request: NextRequest) {
  return handle(async () => {
    const user = await requireUser();
    const query = budgetQuerySchema.safeParse(
      Object.fromEntries(request.nextUrl.searchParams),
    );

    if (!query.success) {
      return validationFailure(query.error);
    }

    const month = query.data.month ?? format(new Date(), "yyyy-MM");
    const budgets = await listBudgets(user.id, month);

    return collection(
      budgets,
      buildMeta({ page: 1, pageSize: DEFAULT_PAGE_SIZE }, budgets.length),
    );
  });
}

export function POST(request: NextRequest) {
  return handle(async () => {
    const user = await requireUser();
    const body = await readJson(request);

    if (!body) {
      return malformedBody();
    }

    const input = createBudgetSchema.safeParse(body.value);

    if (!input.success) {
      return validationFailure(input.error);
    }

    const budget = await createBudget(user.id, input.data, user.baseCurrency);

    return created(budget, `/api/v1/budgets/${budget.id}`);
  });
}
