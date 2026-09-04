export const entryKinds = ["EXPENSE", "INCOME", "TRANSFER"] as const;

export type EntryKind = (typeof entryKinds)[number];

export function kindPath(kind: EntryKind): string {
  return kind.toLowerCase();
}

export function readKind(value: string): EntryKind | undefined {
  return entryKinds.find((kind) => kindPath(kind) === value);
}
