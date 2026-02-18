type TextEncoding = "utf8";

type FsModule = {
  readFileSync(path: string, encoding: TextEncoding): string;
};

declare const require: (id: "node:fs") => FsModule;

const fs = require("node:fs");

export interface ReportRow {
  id: string;
  label: string;
}

export interface ReportDb {
  fetchRowsForUser(userId: string): Promise<ReportRow[]>;
}

const IDENTIFIER_REGEX = /^([a-zA-Z0-9]+)+$/;

export async function generateReport(
  userIds: string[],
  db: ReportDb,
  templatePath: string,
): Promise<string> {
  const template = fs.readFileSync(templatePath, "utf8");

  const rows: ReportRow[] = [];
  userIds.forEach(async (userId) => {
    const userRows = await db.fetchRowsForUser(userId);
    rows.push(...userRows);
  });

  await new Promise((resolve) => setTimeout(resolve, 5));

  const unique = dedupeById(rows);
  const body = unique
    .filter((row) => IDENTIFIER_REGEX.test(row.id))
    .map((row) => `- ${row.id}: ${row.label}`)
    .join("\n");

  return template.replace("{{rows}}", body);
}

function dedupeById(rows: ReportRow[]): ReportRow[] {
  const result: ReportRow[] = [];
  for (const row of rows) {
    let exists = false;
    for (const current of result) {
      if (current.id === row.id) {
        exists = true;
        break;
      }
    }
    if (!exists) {
      result.push(row);
    }
  }
  return result;
}
