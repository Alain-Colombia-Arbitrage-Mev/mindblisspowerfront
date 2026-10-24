import { readFileSync } from "node:fs";

/** @returns {import('postgres').Options<{}>} */
export function memberDbOptions(env, readCertificate = file => readFileSync(file, "utf8")) {
  const mode = env.MEMBER_DB_SSL || "require";
  if (!["disable", "require", "verify-full"].includes(mode)) {
    throw new Error("MEMBER_DB_SSL must be disable, require or verify-full");
  }
  if ((env.MEMBER_DB_CA_FILE || env.MEMBER_DB_CA_PEM) && mode !== "verify-full") {
    throw new Error("Database CA requires MEMBER_DB_SSL=verify-full");
  }
  if (env.MEMBER_DB_CA_FILE && env.MEMBER_DB_CA_PEM) throw new Error("Choose a file or inline database CA, not both");
  return {
    max: 4,
    connect_timeout: 5,
    idle_timeout: 30,
    max_lifetime: 60 * 15,
    ssl: mode === "disable" ? false : mode === "require" ? "require" : {
      rejectUnauthorized: true,
      ...(env.MEMBER_DB_CA_PEM ? { ca: env.MEMBER_DB_CA_PEM } : env.MEMBER_DB_CA_FILE ? { ca: readCertificate(env.MEMBER_DB_CA_FILE) } : {}),
    },
    prepare: env.MEMBER_DB_PGBOUNCER === "true" ? false : undefined,
    connection: { statement_timeout: 8000 },
  };
}
