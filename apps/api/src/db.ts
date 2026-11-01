import postgres from "postgres";

export type Db = postgres.Sql;

export function createDb(url: string): Db {
  return postgres(url, {
    max: 5,
    idle_timeout: 20,
    connect_timeout: 5,
    onnotice: () => undefined,
  });
}
