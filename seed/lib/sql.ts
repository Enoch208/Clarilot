export type SqlValue = string | number | boolean | null;

export function sqlLiteral(value: SqlValue): string {
  if (value === null) {
    return "NULL";
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new Error("Refusing to write a non-finite number to SQL");
    }
    return String(value);
  }
  if (typeof value === "boolean") {
    return value ? "TRUE" : "FALSE";
  }
  return `'${value.replaceAll("'", "''")}'`;
}

export function insertStatements(
  table: string,
  columns: readonly string[],
  rows: readonly (readonly SqlValue[])[],
  batch = 200,
): string[] {
  const statements: string[] = [];
  for (let start = 0; start < rows.length; start += batch) {
    const values = rows
      .slice(start, start + batch)
      .map((row) => `  (${row.map(sqlLiteral).join(", ")})`)
      .join(",\n");
    statements.push(`INSERT INTO ${table} (${columns.join(", ")}) VALUES\n${values};`);
  }
  return statements;
}

export function csvField(value: string | number): string {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}
