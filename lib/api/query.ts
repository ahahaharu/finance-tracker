export type QueryRecord = Record<string, string | string[] | undefined>;

export function readSearchParams(
  parameters: URLSearchParams,
  repeatable: readonly string[] = [],
): QueryRecord {
  const query: QueryRecord = Object.fromEntries(parameters);

  for (const key of repeatable) {
    const values = parameters.getAll(key);

    if (values.length > 0) {
      query[key] = values;
    }
  }

  return query;
}
