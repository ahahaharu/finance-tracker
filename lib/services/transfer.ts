import { randomUUID } from "node:crypto";

import {
  FutureDateError,
  NotFoundError,
  SameWalletTransferError,
  ValidationFailedError,
} from "@/lib/errors";
import type { Wallet } from "@/lib/generated/prisma/client";
import type { Currency } from "@/lib/generated/prisma/enums";
import type { TransactionRecord } from "@/lib/repositories/transaction";
import {
  type TransferLeg,
  transferRepository,
} from "@/lib/repositories/transfer";
import { walletRepository } from "@/lib/repositories/wallet";
import type { CreateTransferInput } from "@/lib/schemas/transfer";
import { assertOwnership } from "@/lib/services/access";
import {
  convertAmount,
  divideHalfUp,
  formatRate,
  RATE_UNIT,
} from "@/lib/services/exchange-rate";
import type { TransactionContext } from "@/lib/services/transaction";

export type TransferSide = {
  walletId: string;
  walletName: string;
  amount: number;
  currency: Currency;
  baseAmount: number;
};

export type TransferView = {
  groupId: string;
  from: TransferSide;
  to: TransferSide;
  rate: string | null;
  occurredAt: Date;
  note: string | null;
  baseCurrency: Currency;
};

function toSide(record: TransactionRecord): TransferSide {
  return {
    walletId: record.wallet.id,
    walletName: record.wallet.name,
    amount: record.amount,
    currency: record.currency,
    baseAmount: record.baseAmount,
  };
}

export function transferRate(from: TransferSide, to: TransferSide): string | null {
  if (from.currency === to.currency) {
    return null;
  }

  return formatRate(
    divideHalfUp(BigInt(to.amount) * RATE_UNIT, BigInt(from.amount)),
  );
}

export function toTransferView(
  records: readonly TransactionRecord[],
  baseCurrency: Currency,
): TransferView {
  const outgoing = records.find((record) => record.type === "TRANSFER_OUT");
  const incoming = records.find((record) => record.type === "TRANSFER_IN");

  if (!outgoing || !incoming || outgoing.transferGroupId === null) {
    throw new NotFoundError();
  }

  const from = toSide(outgoing);
  const to = toSide(incoming);

  return {
    groupId: outgoing.transferGroupId,
    from,
    to,
    rate: transferRate(from, to),
    occurredAt: outgoing.occurredAt,
    note: outgoing.note,
    baseCurrency,
  };
}

async function ownedWallet(userId: string, walletId: string): Promise<Wallet> {
  const wallet = await walletRepository.findById(walletId);

  assertOwnership(wallet, userId);

  return wallet;
}

async function ownedGroup(
  userId: string,
  groupId: string,
): Promise<TransactionRecord[]> {
  const records = await transferRepository.findByGroupId(groupId);

  if (records.length === 0) {
    throw new NotFoundError();
  }

  for (const record of records) {
    assertOwnership(record, userId);
  }

  return records;
}

export async function getTransfer(
  userId: string,
  groupId: string,
  context: TransactionContext,
): Promise<TransferView> {
  return toTransferView(
    await ownedGroup(userId, groupId),
    context.baseCurrency,
  );
}

export async function createTransfer(
  userId: string,
  input: CreateTransferInput,
  context: TransactionContext,
): Promise<TransferView> {
  if (input.fromWalletId === input.toWalletId) {
    throw new SameWalletTransferError();
  }

  if (input.occurredAt.getTime() > context.now.getTime()) {
    throw new FutureDateError();
  }

  const [from, to] = await Promise.all([
    ownedWallet(userId, input.fromWalletId),
    ownedWallet(userId, input.toWalletId),
  ]);

  const sameCurrency = from.currency === to.currency;

  if (sameCurrency && input.amountTo !== undefined) {
    if (input.amountTo !== input.amountFrom) {
      throw new ValidationFailedError({ fields: ["amountTo"] });
    }
  }

  if (!sameCurrency && input.amountTo === undefined) {
    throw new ValidationFailedError({ fields: ["amountTo"] });
  }

  const amountTo = sameCurrency ? input.amountFrom : (input.amountTo as number);

  const [outgoing, incoming] = await Promise.all([
    convertAmount({
      amount: input.amountFrom,
      from: from.currency,
      to: context.baseCurrency,
      on: input.occurredAt,
    }),
    convertAmount({
      amount: amountTo,
      from: to.currency,
      to: context.baseCurrency,
      on: input.occurredAt,
    }),
  ]);

  const groupId = randomUUID();

  const shared = {
    userId,
    occurredAt: input.occurredAt,
    note: input.note ?? null,
    transferGroupId: groupId,
  };

  const legs: [TransferLeg, TransferLeg] = [
    {
      ...shared,
      walletId: from.id,
      type: "TRANSFER_OUT",
      amount: input.amountFrom,
      currency: from.currency,
      baseAmount: outgoing.amount,
      rate: outgoing.rate,
      rateDate: outgoing.rateDate,
    },
    {
      ...shared,
      walletId: to.id,
      type: "TRANSFER_IN",
      amount: amountTo,
      currency: to.currency,
      baseAmount: incoming.amount,
      rate: incoming.rate,
      rateDate: incoming.rateDate,
    },
  ];

  const created = await transferRepository.createPair(legs);

  return toTransferView(created, context.baseCurrency);
}

export async function deleteTransfer(
  userId: string,
  groupId: string,
): Promise<void> {
  await ownedGroup(userId, groupId);

  await transferRepository.removeByGroupId(groupId);
}
