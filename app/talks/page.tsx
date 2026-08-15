import type { Metadata } from "next";
import { parse } from "smol-toml";
import contentSource from "virtual:site-content";

type Organization = {
  id: string;
  name: string;
  description: string;
  logo: string;
  color: string;
};

type Talk = {
  organization: string;
  title: string;
  speaker: string;
  year: number;
  youtube_url: string;
};

type TalksContent = {
  site: {
    logo: string;
  };
  sections: {
    talks_kicker: string;
    talks_title: string;
    talks_intro: string;
  };
  organizations: Organization[];
  talks: Talk[];
};

const content = parse(contentSource) as unknown as TalksContent;
const assetPrefix = process.env.NEXT_PUBLIC_ASSET_PREFIX ?? "";
const talksTitle = "JuliaCon life-science talks — JuliaLifeSciences";
const talksDescription = "Past JuliaCon talks from the BioJulia, JuliaHealth, and EcoJulia communities.";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: talksTitle,
  description: talksDescription,
  openGraph: { title: talksTitle, description: talksDescription, images: [] },
  twitter: { title: talksTitle, description: talksDescription, images: [] },
};

function withAssetPrefix(path: string) {
  return path.startsWith("/") ? `${assetPrefix}${path}` : path;
}

function youtubeId(url: string) {
  const parsed = new URL(url);
  return parsed.hostname === "youtu.be" ? parsed.pathname.slice(1) : parsed.searchParams.get("v");
}

export default function TalksPage() {
  const { site, sections, organizations, talks } = content;

  return (
    <main>
      <header className="site-header shell">
        <a className="brand" href={withAssetPrefix("/")} aria-label="JuliaLifeSciences home">
          <img src={withAssetPrefix(site.logo)} alt="JuliaLifeSciences" />
        </a>
        <a className="header-link" href={withAssetPrefix("/")}><span aria-hidden="true">←</span>Back to packages</a>
      </header>

      <section className="talks-hero shell">
        <p className="kicker">{sections.talks_kicker}</p>
        <h1>{sections.talks_title}</h1>
        <p>{sections.talks_intro}</p>
      </section>

      <div className="talks-groups shell">
        {organizations.map((organization) => {
          const organizationTalks = talks.filter((talk) => talk.organization === organization.id);
          if (organizationTalks.length === 0) return null;

          return (
            <section className="talk-group" key={organization.id} style={{ "--org-color": organization.color } as React.CSSProperties}>
              <div className="talk-group-heading">
                <img src={organization.logo} alt={`${organization.name} logo`} />
                <div>
                  <p>{organizationTalks.length} talks</p>
                  <h2>{organization.name}</h2>
                  <span>{organization.description}</span>
                </div>
              </div>
              <div className="talk-grid">
                {organizationTalks.map((talk) => {
                  const videoId = youtubeId(talk.youtube_url);
                  return (
                    <article className="talk-card" key={talk.youtube_url}>
                      <div className="talk-video">
                        <iframe
                          src={`https://www.youtube-nocookie.com/embed/${videoId}`}
                          title={talk.title}
                          loading="lazy"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                        />
                      </div>
                      <div className="talk-copy">
                        <p>JuliaCon {talk.year}</p>
                        <h3>{talk.title}</h3>
                        <span>{talk.speaker}</span>
                        <a href={talk.youtube_url} target="_blank" rel="noreferrer">Watch on YouTube <i aria-hidden="true">↗</i></a>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}
