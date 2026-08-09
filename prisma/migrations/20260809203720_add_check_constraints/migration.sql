ALTER TABLE "Transaction"
    ADD CONSTRAINT "transaction_amount_positive" CHECK ("amount" > 0),
    ADD CONSTRAINT "transaction_rate_positive" CHECK ("rate" > 0),
    ADD CONSTRAINT "transaction_category_matches_type" CHECK (
        ("type" IN ('INCOME', 'EXPENSE') AND "categoryId" IS NOT NULL)
        OR
        ("type" IN ('TRANSFER_IN', 'TRANSFER_OUT') AND "categoryId" IS NULL)
    ),
    ADD CONSTRAINT "transaction_transfer_has_group" CHECK (
        ("type" IN ('TRANSFER_IN', 'TRANSFER_OUT')) = ("transferGroupId" IS NOT NULL)
    );

ALTER TABLE "Budget"
    ADD CONSTRAINT "budget_limit_positive" CHECK ("limitAmount" > 0),
    ADD CONSTRAINT "budget_month_is_first_day" CHECK (EXTRACT(DAY FROM "month") = 1);

ALTER TABLE "ExchangeRate"
    ADD CONSTRAINT "exchange_rate_rate_positive" CHECK ("rate" > 0),
    ADD CONSTRAINT "exchange_rate_target_is_byn" CHECK ("toCurrency" = 'BYN');

CREATE UNIQUE INDEX "User_email_lower_key" ON "User" (lower("email"));
