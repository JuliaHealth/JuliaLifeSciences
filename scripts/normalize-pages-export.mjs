import { mkdir, rename, rmdir } from "node:fs/promises";
import { join } from "node:path";

const pagesPath = process.env.PAGES_ASSET_PREFIX?.replace(/^\/+|\/+$/g, "");
const clientDirectory = join(process.cwd(), "dist", "client");

await mkdir(join(clientDirectory, "talks"), { recursive: true });
await rename(join(clientDirectory, "talks.html"), join(clientDirectory, "talks", "index.html"));

if (pagesPath) {
  const nestedDirectory = join(clientDirectory, pagesPath);

  await rename(join(nestedDirectory, "_next"), join(clientDirectory, "_next"));
  await rmdir(nestedDirectory);
}
