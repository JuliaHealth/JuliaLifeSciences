import { type CSSProperties } from "react";
import { ArrowDown, BookOpen, FileText, FolderGit2 } from "lucide-react";
import { parse } from "smol-toml";
import contentSource from "virtual:site-content";

type Organization = {
  id: string;
  name: string;
  description: string;
  url: string;
  logo: string;
  color: string;
  focus: string;
};

type Capability = {
  number: string;
  title: string;
  description: string;
  packages: string[];
};

type Package = {
  name: string;
  organization: string;
  organization_name?: string;
  organization_logo?: string;
  organization_color?: string;
  description: string;
  repo: string;
  paper?: string;
  tutorial?: string;
  stars: number;
  featured?: boolean;
};

type Testimonial = {
  quote: string;
  name: string;
  organization: string;
  role?: string;
};

type Content = {
  site: {
    logo: string;
    eyebrow: string;
    title: string;
    accent: string;
    intro: string;
    primary_cta: string;
    secondary_cta: string;
    scroll_cue: string;
    topics: string[];
    proofs: string[];
    footer_note: string;
  };
  sections: {
    capabilities_kicker: string;
    capabilities_title: string;
    capabilities_intro: string;
    organizations_kicker: string;
    organizations_title: string;
    organizations_intro: string;
    testimonials_kicker: string;
    testimonials_title: string;
    testimonials_intro: string;
  };
  organizations: Organization[];
  capabilities: Capability[];
  packages: Package[];
  testimonials: Testimonial[];
};

const content = parse(contentSource) as unknown as Content;
const assetPrefix = process.env.NEXT_PUBLIC_ASSET_PREFIX ?? "";

function withAssetPrefix(path: string) {
  return path.startsWith("/") ? `${assetPrefix}${path}` : path;
}

function capabilitySlug(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function PackageCarousel({
  capabilities,
  packages,
  organizations,
}: {
  capabilities: Capability[];
  packages: Package[];
  organizations: Organization[];
}) {
  const organizationsById = new Map(organizations.map((org) => [org.id, org]));
  const sortedPackages = [...packages].sort((a, b) => {
    const communityDifference = Number(!organizationsById.has(a.organization)) - Number(!organizationsById.has(b.organization));
    return communityDifference || b.stars - a.stars;
  });
  const filterRules = [
    `#package-filter-all:checked ~ .package-filters label[for="package-filter-all"] { background: var(--white); border-color: var(--white); color: var(--ink); }`,
    `#package-filter-all:focus-visible ~ .package-filters label[for="package-filter-all"] { outline: 2px solid #7dd0a5; outline-offset: 3px; }`,
    ...capabilities.flatMap((capability) => {
      const slug = capabilitySlug(capability.title);
      const id = `package-filter-${slug}`;
      return [
        `#${id}:checked ~ .package-track .package-card:not(.capability-${slug}) { display: none; }`,
        `#${id}:checked ~ .package-filters label[for="${id}"] { background: var(--white); border-color: var(--white); color: var(--ink); }`,
        `#${id}:focus-visible ~ .package-filters label[for="${id}"] { outline: 2px solid #7dd0a5; outline-offset: 3px; }`,
      ];
    }),
  ].join("\n");

  return (
    <div className="package-showcase">
      <style>{filterRules}</style>
      <input className="package-filter-input" type="radio" name="package-filter" id="package-filter-all" defaultChecked />
      {capabilities.map((capability) => (
        <input
          className="package-filter-input"
          type="radio"
          name="package-filter"
          id={`package-filter-${capabilitySlug(capability.title)}`}
          key={capability.number}
        />
      ))}

      <div className="package-filters" aria-label="Filter packages by capability">
        <span>Filter by capability</span>
        <label htmlFor="package-filter-all">Show all</label>
        {capabilities.map((capability) => (
          <label htmlFor={`package-filter-${capabilitySlug(capability.title)}`} key={capability.number}>{capability.title}</label>
        ))}
        <output className="package-position" data-package-position aria-live="polite">1 / {sortedPackages.length}</output>
      </div>

      <div
        className="package-track"
        role="region"
        aria-roledescription="carousel"
        aria-label="Packages ordered by GitHub stars"
      >
        <div className="package-strip">
            <div className="package-sequence">
              {sortedPackages.map((pkg) => {
                const org = organizationsById.get(pkg.organization) ?? {
                  name: pkg.organization_name ?? pkg.organization,
                  logo: pkg.organization_logo ?? "",
                  color: pkg.organization_color ?? "#4063d8",
                };
                const packageCapabilities = capabilities.filter((capability) => capability.packages.includes(pkg.name));
                const capabilityClasses = packageCapabilities.map((capability) => `capability-${capabilitySlug(capability.title)}`).join(" ");
                const extraLinks = [
                  { label: "Tutorial", href: pkg.tutorial, Icon: BookOpen },
                  { label: "Paper", href: pkg.paper, Icon: FileText },
                ];

                return (
                  <div className={`package-card ${capabilityClasses}`} key={pkg.name} style={{ "--org-color": org.color } as CSSProperties}>
                    <div className="package-card-top">
                      <a className="package-repo-link" href={pkg.repo} target="_blank" rel="noreferrer"><FolderGit2 aria-hidden="true" />Repository</a>
                      <img className="org-mini-logo" src={org.logo} alt={`${org.name} logo`} />
                    </div>

                    <div className="package-meta">
                      {pkg.featured ? <span className="featured-label">Most starred</span> : null}
                      <span className="star-count" aria-label={`${pkg.stars} GitHub stars`}>★ {pkg.stars}</span>
                    </div>
                    <div className="package-capability-tags" aria-label={`${pkg.name} capabilities`}>
                      {packageCapabilities.map((capability) => (
                        <label htmlFor={`package-filter-${capabilitySlug(capability.title)}`} key={capability.number}>{capability.title}</label>
                      ))}
                    </div>
                    <h4>{pkg.name}</h4>
                    <p>{pkg.description}</p>
                    {pkg.tutorial || pkg.paper ? (
                      <div className="package-links">
                        {extraLinks.map(({ label, href, Icon }) => href ? (
                          <a href={href} key={label} target="_blank" rel="noreferrer"><Icon aria-hidden="true" />{label}</a>
                        ) : null)}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const { site, sections, organizations, capabilities, packages, testimonials } = content;

  return (
    <main>
      <header className="site-header shell">
        <a className="brand" href="#top" aria-label="JuliaLifeSciences home">
          <img src={withAssetPrefix(site.logo)} alt="JuliaLifeSciences" />
        </a>
      </header>

      <section className="hero shell" id="top">
        <div className="hero-copy">
          <p className="eyebrow"><span />{site.eyebrow}</p>
          <h1>{site.title} <em>{site.accent}</em></h1>
          <p className="hero-intro">{site.intro}</p>
          <div className="hero-actions">
            <a className="button button-primary" href="#possibilities">{site.primary_cta}<span aria-hidden="true">↘</span></a>
            <a className="button button-quiet" href="#ecosystem">{site.secondary_cta}</a>
          </div>
          <ul className="proof-list" aria-label="Julia benefits">
            {site.proofs.map((proof) => <li key={proof}>{proof}</li>)}
          </ul>
        </div>

        <div className="hero-visual" aria-label={`Explore ${site.topics.join(", ")}`}>
          <div className="visual-core">
            <span className="julia-dots"><i /><i /><i /></span>
            <strong>One language.</strong>
            <small>Every scale of life.</small>
          </div>
          {site.topics.map((topic, index) => (
            <span className={`topic topic-${index + 1}`} key={topic}>{topic}</span>
          ))}
          <span className="orbit orbit-one" />
          <span className="orbit orbit-two" />
        </div>

        <a className="scroll-cue" href="#ecosystem">
          <span>{site.scroll_cue}</span>
          <span className="scroll-cue-icon" aria-hidden="true"><ArrowDown /></span>
        </a>
      </section>

      <section className="org-section shell" id="ecosystem">
        <div className="section-heading">
          <div>
            <p className="kicker">{sections.organizations_kicker}</p>
            <h2>{sections.organizations_title}</h2>
          </div>
          <p>{sections.organizations_intro}</p>
        </div>
        <div className="org-grid">
          {organizations.map((org, index) => (
            <a className="org-card" href={org.url} key={org.id} target="_blank" rel="noreferrer" style={{ "--org-color": org.color } as CSSProperties}>
              <span className="card-number">0{index + 1}</span>
              <img src={org.logo} alt={`${org.name} logo`} />
              <p>{org.focus}</p>
              <h3>{org.name}</h3>
              <span>{org.description}</span>
              <b>Visit community <i aria-hidden="true">↗</i></b>
            </a>
          ))}
        </div>
      </section>

      <section className="capability-section" id="possibilities">
        <div className="shell">
          <div className="section-heading">
            <div>
              <p className="kicker">{sections.capabilities_kicker}</p>
              <h2>{sections.capabilities_title}</h2>
            </div>
            <p>{sections.capabilities_intro}</p>
          </div>
          <PackageCarousel capabilities={capabilities} packages={packages} organizations={organizations} />
        </div>
      </section>

      <section className="testimonials-section" id="testimonials">
        <div className="shell">
          <div className="section-heading testimonial-heading">
            <div>
              <p className="kicker">{sections.testimonials_kicker}</p>
              <h2>{sections.testimonials_title}</h2>
            </div>
            <p>{sections.testimonials_intro}</p>
          </div>
          <div className="testimonial-grid">
            {testimonials.map((testimonial, index) => (
              <figure className="testimonial-card" key={`${testimonial.name}-${index}`}>
                <span className="quote-mark">“</span>
                <blockquote>{testimonial.quote}</blockquote>
                <figcaption>
                  <span className="avatar-placeholder" aria-hidden="true">{testimonial.name.slice(0, 1)}</span>
                  <div>
                    <strong>{testimonial.name}</strong>
                    <span>{testimonial.role ? `${testimonial.role} · ` : ""}{testimonial.organization}</span>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <footer>
        <div className="shell footer-inner">
          <a className="brand footer-brand" href="#top"><img src={withAssetPrefix(site.logo)} alt="JuliaLifeSciences" /></a>
          <p>{site.footer_note}</p>
          <div className="footer-links">
            {organizations.map((org) => <a href={org.url} target="_blank" rel="noreferrer" key={org.id}>{org.name}</a>)}
          </div>
        </div>
      </footer>
    </main>
  );
}
