import { readFile, rename, unlink, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { parse } from "smol-toml";

const contentPath = new URL("../content.toml", import.meta.url);
const temporaryContentPath = new URL(`../.content.toml.${process.pid}.tmp`, import.meta.url);

export function githubRepository(repoUrl) {
  const url = new URL(repoUrl);
  const [owner, repository] = url.pathname.split("/").filter(Boolean);
  if (url.hostname !== "github.com" || !owner || !repository) {
    throw new Error(`Unsupported GitHub repository URL: ${repoUrl}`);
  }
  return { owner, repository: repository.replace(/\.git$/, "") };
}

export function updatePackageStars(source, starsByRepo) {
  const sectionPattern = /^\[\[[^\]]+\]\]\s*$/gm;
  const sections = [...source.matchAll(sectionPattern)];
  let updated = source.slice(0, sections[0]?.index ?? source.length);

  for (const [index, section] of sections.entries()) {
    const start = section.index;
    const end = sections[index + 1]?.index ?? source.length;
    let block = source.slice(start, end);

    if (section[0] === "[[packages]]") {
      const repo = block.match(/^repo\s*=\s*"([^"]+)"\s*$/m)?.[1];
      if (!repo || !starsByRepo.has(repo)) {
        throw new Error(`Missing refreshed star count for ${repo ?? "a package without a repo"}`);
      }
      if (!/^stars[ \t]*=[ \t]*\d+[ \t]*$/m.test(block)) {
        throw new Error(`Missing stars field for ${repo}`);
      }
      block = block.replace(/^stars[ \t]*=[ \t]*\d+[ \t]*$/m, `stars = ${starsByRepo.get(repo)}`);
    }

    updated += block;
  }

  return updated;
}

async function fetchStars(repoUrl, token) {
  const { owner, repository } = githubRepository(repoUrl);
  const response = await fetch(`https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}`, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "User-Agent": "JuliaLifeSciences-star-refresh",
      "X-GitHub-Api-Version": "2026-03-10",
    },
  });
  if (!response.ok) {
    throw new Error(`GitHub returned ${response.status} for ${owner}/${repository}`);
  }

  const data = await response.json();
  if (!Number.isSafeInteger(data.stargazers_count) || data.stargazers_count < 0) {
    throw new Error(`Invalid star count for ${owner}/${repository}`);
  }
  return data.stargazers_count;
}

async function main() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error("GITHUB_TOKEN is required to refresh stars");

  const source = await readFile(contentPath, "utf8");
  const content = parse(source);
  const starsByRepo = new Map();

  for (const pkg of content.packages) {
    const stars = await fetchStars(pkg.repo, token);
    starsByRepo.set(pkg.repo, stars);
    console.log(`${pkg.name}: ${pkg.stars} -> ${stars}`);
  }

  try {
    await writeFile(temporaryContentPath, updatePackageStars(source, starsByRepo));
    await rename(temporaryContentPath, contentPath);
  } finally {
    await unlink(temporaryContentPath).catch(() => {});
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
