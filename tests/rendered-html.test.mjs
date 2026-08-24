import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { parse } from "smol-toml";
import { githubRepository, updatePackageStars } from "../scripts/refresh-stars.mjs";

test("exports the JuliaLifeSciences homepage", async () => {
  const html = await readFile(new URL("../dist/client/index.html", import.meta.url), "utf8");
  const stylesheet = html.match(/href="[^\"]*\/_next\/static\/css\/([^\"]+\.css)"/);

  assert.match(html, /<title>JuliaLifeSciences/);
  assert.match(html, /src="\/JuliaLifeSciences\/JuliaLifeSciencesLogo\.svg"/);
  assert.doesNotMatch(html, /\/public\/JuliaLifeSciencesLogo\.svg/);
  assert.ok(stylesheet, "the exported page should reference its stylesheet");
  assert.match(
    await readFile(new URL(`../dist/client/_next/static/css/${stylesheet[1]}`, import.meta.url), "utf8"),
    /\.site-header/,
  );
  assert.match(html, /One language/);
  assert.match(html, /BioJulia/);
  assert.match(html, /href="https:\/\/julialang\.slack\.com\/app_redirect\?channel=biology"[^>]*>#biology/);
  assert.match(html, /href="https:\/\/julialang\.slack\.com\/app_redirect\?channel=sciml-sysbio"[^>]*>#sciml-sysbio/);
  assert.match(html, /href="https:\/\/julialang\.slack\.com\/app_redirect\?channel=health-and-medicine"[^>]*>#health-and-medicine/);
  assert.match(html, /KomaMRI\.jl/);
  assert.match(html, /EcoSISTEM\.jl/);
  assert.match(html, /Three communities\. One shared purpose\./);
  assert.match(html, /Hand-curated packages/);
  assert.match(html, /href="#possibilities"[^>]*>Explore packages/);
  assert.match(html, /href="#ecosystem"[^>]*>Meet the communities/);
  assert.match(html, /Scroll to explore/);
  assert.match(html, /class="scroll-cue"[^>]*href="#ecosystem"/);
  assert.match(html, /href="\/JuliaLifeSciences\/talks\/"[^>]*>JuliaCon talks/);
  assert.match(html, /lucide-arrow-down/);
  assert.match(html, /lucide-folder-git-2/);
  assert.match(html, /class="package-card-top"><a class="package-repo-link"/);
  assert.match(html, /lucide-book-open/);
  assert.match(html, /lucide-file-text/);
  assert.match(html, /class="package-documentation-link"/);
  assert.match(html, /class="package-paper-link"/);
  assert.ok(
    html.indexOf("Three communities. One shared purpose.") < html.indexOf("From raw data to discovery."),
    "the ecosystem should appear before capabilities",
  );
  assert.equal(html.match(/aria-roledescription="carousel"/g)?.length, 1);
  assert.doesNotMatch(html, /package-sequence-clone/);
  assert.doesNotMatch(html, /\sinert(?:=|>)/);
  assert.equal(html.match(/class="package-filter-input"/g)?.length, 6);
  assert.match(html, /Show all/);
  assert.match(html, /data-package-position/);
  assert.doesNotMatch(html, /carousel-counter\.js/);
  assert.match(html, /package-capability-tags/);
  assert.doesNotMatch(html, /class="testimonials-section"/);
  assert.doesNotMatch(html, /carousel-controls|lucide-pause|lucide-play|Previous .* package|Next .* package/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape/);
});

test("exports organization-grouped JuliaCon talks", async () => {
  const html = await readFile(new URL("../dist/client/talks/index.html", import.meta.url), "utf8");
  const content = parse(await readFile(new URL("../content.toml", import.meta.url), "utf8"));
  const organizationIds = new Set(content.organizations.map((organization) => organization.id));
  const videoIds = new Set();

  assert.match(html, /<title>JuliaCon life-science talks/);
  assert.match(html, /src="\/JuliaLifeSciences\/JuliaLifeSciencesLogo\.svg"/);
  assert.match(html, /Life sciences on stage\./);
  assert.equal(content.talks.length, 9);
  assert.equal(html.match(/<iframe /g)?.length, content.talks.length);
  assert.equal(html.match(/aria-roledescription="carousel"/g)?.length, content.organizations.length);
  assert.equal(html.match(/<output data-talk-position/g)?.length, content.organizations.length);

  for (const talk of content.talks) {
    assert.ok(organizationIds.has(talk.organization), `${talk.title} references an unknown organization`);
    const url = new URL(talk.youtube_url);
    const videoId = url.hostname === "youtu.be" ? url.pathname.slice(1) : url.searchParams.get("v");
    assert.ok(videoId, `${talk.title} needs a YouTube video ID`);
    assert.ok(!videoIds.has(videoId), `${talk.title} duplicates a video`);
    videoIds.add(videoId);
    assert.match(html, new RegExp(`youtube-nocookie\\.com/embed/${videoId}`));
  }

  for (const organization of content.organizations) {
    assert.equal(content.talks.filter((talk) => talk.organization === organization.id).length, 3);
  }

  const expectedTitles = content.organizations.flatMap((organization) =>
    content.talks.filter((talk) => talk.organization === organization.id).map((talk) => talk.title)
  );
  const renderedTitles = [...html.matchAll(/<h3>([^<]+)<\/h3>/g)].map((match) =>
    match[1].replaceAll("&amp;", "&").replaceAll("&#x27;", "'")
  );
  assert.deepEqual(renderedTitles, expectedTitles, "talks should follow content.toml order within each organization");
});

test("packages define valid capability tags and organization attribution", async () => {
  const source = await readFile(new URL("../content.toml", import.meta.url), "utf8");
  const content = parse(source);
  const capabilityIds = new Set(content.capabilities.map((capability) => capability.id));

  assert.equal(content.testimonials, undefined, "commented testimonial blocks should disable the section");

  assert.deepEqual(
    content.organizations.filter((org) => org.slack_channels).map((org) => [org.id, org.slack_channels]),
    [["biojulia", ["#biology", "#sciml-sysbio"]], ["juliahealth", ["#health-and-medicine"]]],
  );
  for (const organization of content.organizations) {
    for (const channel of organization.slack_channels ?? []) {
      assert.match(channel, /^#[a-z0-9-]+$/, `${organization.name} has an invalid Slack channel`);
    }
  }

  assert.equal(capabilityIds.size, content.capabilities.length, "capability IDs should be unique");
  for (const capability of content.capabilities) {
    assert.ok(!("examples" in capability), `${capability.title} should not define example tags`);
    assert.ok(!("packages" in capability), `${capability.title} should not list packages`);
    assert.match(capability.id, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    assert.ok(content.packages.some((pkg) => pkg.capabilities.includes(capability.id)), `${capability.title} needs packages`);
  }

  assert.deepEqual(
    content.packages.filter((pkg) => pkg.capabilities.includes("interoperability")).map((pkg) => pkg.name),
    ["PythonCall.jl", "RCall.jl", "JuliaCall"],
  );

  for (const pkg of content.packages) {
    assert.ok(!("tags" in pkg), `${pkg.name} should not define tags`);
    assert.ok(!("logo" in pkg), `${pkg.name} should not define package artwork`);
    assert.ok(pkg.capabilities.length > 0, `${pkg.name} needs at least one capability`);
    assert.equal(new Set(pkg.capabilities).size, pkg.capabilities.length, `${pkg.name} has duplicate capabilities`);
    for (const capabilityId of pkg.capabilities) {
      assert.ok(capabilityIds.has(capabilityId), `${pkg.name} references unknown capability ${capabilityId}`);
    }
    if (!content.organizations.some((org) => org.id === pkg.organization)) {
      assert.ok(pkg.organization_name && pkg.organization_logo && pkg.organization_color, `${pkg.name} needs organization metadata`);
    }
  }
});

test("refreshes package stars without reordering content.toml", async () => {
  const source = await readFile(new URL("../content.toml", import.meta.url), "utf8");
  const before = parse(source);
  const starsByRepo = new Map(before.packages.map((pkg, index) => [pkg.repo, 10_000 + index]));
  const after = parse(updatePackageStars(source, starsByRepo));

  assert.deepEqual(after.packages.map((pkg) => pkg.name), before.packages.map((pkg) => pkg.name));
  assert.deepEqual(after.packages.map((pkg) => pkg.stars), before.packages.map((_, index) => 10_000 + index));
  assert.deepEqual(
    after.packages.map((pkg) => ({ ...pkg, stars: undefined })),
    before.packages.map((pkg) => ({ ...pkg, stars: undefined })),
  );
  assert.deepEqual({ ...after, packages: undefined }, { ...before, packages: undefined });
  assert.deepEqual(githubRepository("https://github.com/JuliaHealth/KomaMRI.jl"), {
    owner: "JuliaHealth",
    repository: "KomaMRI.jl",
  });
});

test("renders one community-first, star-ordered package carousel with capability filters", async () => {
  const source = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  const html = await readFile(new URL("../dist/client/index.html", import.meta.url), "utf8");
  const content = parse(await readFile(new URL("../content.toml", import.meta.url), "utf8"));
  const communityIds = new Set(content.organizations.map((organization) => organization.id));
  const expectedNames = [...content.packages]
    .sort((a, b) => Number(!communityIds.has(a.organization)) - Number(!communityIds.has(b.organization)) || b.stars - a.stars)
    .map((pkg) => pkg.name);
  const renderedNames = [...html.matchAll(/<h4>([^<]+)<\/h4>/g)].map((match) => match[1]);

  assert.deepEqual(renderedNames, expectedNames);
  assert.match(source, /organizationsById\.has\(a\.organization\)/);
  assert.match(source, /communityDifference \|\| b\.stars - a\.stars/);
  assert.match(source, /pkg\.capabilities\.includes\(capability\.id\)/);
  assert.doesNotMatch(source, /capability\.packages/);
  assert.match(source, /package-filter-all/);
  assert.match(source, /package-card:not\(\.capability-/);
  assert.match(source, /<CarouselCounter kind="packages"/);
  assert.doesNotMatch(source, /suppressHydrationWarning/);
  assert.match(css, /--package-card-width:\s*calc\(\(100cqw - 42px\) \/ 4\)/);
  assert.match(css, /@media \(max-width: 700px\)[\s\S]*--package-card-width:\s*88cqw/);
});

test("uses manual scrolling with a hydration-safe live position counter", async () => {
  const source = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  const counter = await readFile(new URL("../app/carousel-counter.tsx", import.meta.url), "utf8");
  const talksSource = await readFile(new URL("../app/talks/page.tsx", import.meta.url), "utf8");
  const layout = await readFile(new URL("../app/layout.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(css, /package-marquee/);
  assert.match(css, /\.package-track\s*\{[^}]*overflow-x:\s*auto/);
  assert.match(css, /scroll-snap-type:\s*inline proximity/);
  assert.match(css, /scrollbar-width:\s*thin/);
  assert.match(counter, /addEventListener\("scroll"/);
  assert.match(counter, /useEffect/);
  assert.match(counter, /data-package-position/);
  assert.match(counter, /cards\.length/);
  assert.match(counter, /track\.scrollLeft \/ cardStep/);
  assert.doesNotMatch(counter, /getBoundingClientRect/);
  assert.doesNotMatch(source, /autoDelay|requestAnimationFrame|setIsPaused|scrollToPackage/);
  assert.match(css, /\.talk-track\s*\{[^}]*overflow-x:\s*auto/);
  assert.match(css, /--talk-card-width:\s*calc\(\(100cqw - 32px\) \/ 3\)/);
  assert.match(css, /@media \(max-width: 700px\)[\s\S]*--talk-card-width:\s*88cqw/);
  assert.match(counter, /\.talk-carousel/);
  assert.match(counter, /data-talk-position/);
  assert.match(talksSource, /<CarouselCounter kind="talks"/);
  assert.doesNotMatch(talksSource, /suppressHydrationWarning/);
  assert.doesNotMatch(layout, /carousel-counter\.js|<script/);
  assert.match(css, /\.package-links\s*\{[^}]*justify-content:\s*flex-start/);
  assert.match(css, /\.package-paper-link\s*\{[^}]*margin-left:\s*auto/);
  assert.match(css, /@media \(max-width: 700px\)[\s\S]*?\.orbit-two, \.scroll-cue-icon svg \{ animation: none; \}/);
});
