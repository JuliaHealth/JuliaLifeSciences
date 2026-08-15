import { rename, rmdir } from "node:fs/promises";
import { join } from "node:path";

const pagesPath = process.env.PAGES_ASSET_PREFIX?.replace(/^\/+|\/+$/g, "");

if (pagesPath) {
  const clientDirectory = join(process.cwd(), "dist", "client");
  const nestedDirectory = join(clientDirectory, pagesPath);

  await rename(join(nestedDirectory, "_next"), join(clientDirectory, "_next"));
  await rmdir(nestedDirectory);
}
