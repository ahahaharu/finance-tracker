import { format } from "date-fns";

import {
  canAdvance,
  containsDate,
  rangeBounds,
  type RangeKind,
  rangeKinds,
  shiftAnchor,
} from "@/lib/services/analytics";

import { single, type SearchParams } from "./month";

export type PeriodState = {
  range: RangeKind;
  from: string;
  to: string;
};

const datePattern = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

function toDate(value: string): Date {
  return new Date(`${value}T00:00:00`);
}

function toValue(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

function readDate(query: SearchParams, key: string, fallback: string): string {
  const value = single(query[key]);

  return value && datePattern.test(value) ? value : fallback;
}

function readRange(query: SearchParams): RangeKind {
  const value = single(query.range);

  return rangeKinds.find((kind) => kind === value) ?? "month";
}

function toState(
  range: RangeKind,
  anchor: string,
  until: string,
  today: string,
): PeriodState {
  const bounds = rangeBounds(
    range,
    toDate(anchor > today ? today : anchor),
    toDate(until > today ? today : until),
  );

  return { range, from: toValue(bounds.from), to: toValue(bounds.to) };
}

export function today(): string {
  return toValue(new Date());
}

export function readPeriod(query: SearchParams, now: string): PeriodState {
  const range = readRange(query);
  const anchor = readDate(query, "from", now);

  return toState(range, anchor, readDate(query, "to", anchor), now);
}

export function periodRange(state: PeriodState) {
  return rangeBounds(state.range, toDate(state.from), toDate(state.to));
}

export function isCurrent(state: PeriodState, now: string): boolean {
  return containsDate(periodRange(state), toDate(now));
}

export function hasNext(state: PeriodState, now: string): boolean {
  return canAdvance(periodRange(state), toDate(now));
}

export function withRange(
  state: PeriodState,
  range: RangeKind,
  now: string,
): PeriodState {
  const anchor = isCurrent(state, now) ? now : state.from;

  return toState(range, anchor, range === "custom" ? state.to : anchor, now);
}

export function currentPeriod(range: RangeKind, now: string): PeriodState {
  return toState(range, now, now, now);
}

export function shiftPeriod(
  state: PeriodState,
  offset: number,
  now: string,
): PeriodState {
  const anchor = toValue(shiftAnchor(state.range, toDate(state.from), offset));

  return toState(state.range, anchor, anchor, now);
}

export function periodQuery(state: PeriodState): Record<string, string> {
  return state.range === "custom"
    ? { range: state.range, from: state.from, to: state.to }
    : { range: state.range, from: state.from };
}

export function periodKey(state: PeriodState): string {
  return `${state.range}-${state.from}-${state.to}`;
}

export function periodMonth(state: PeriodState, now: string): string {
  const month = state.from.slice(0, 7);

  return month === state.to.slice(0, 7) ? month : now.slice(0, 7);
}
