# JuliaLifeSciences website

The public site content lives in [`content.toml`](content.toml). Edit that one file to change:

- hero and section copy;
- organizations, their logos, and optional Julia Slack channels;
- JuliaCon talks, speakers, years, organization groupings, and YouTube links;
- capabilities;
- package order, descriptions, capabilities, logos, repositories, papers, documentation links, and stars;
- testimonials, names, roles, and organizations.

Each `[[packages]]` block uses `capabilities = ["data-io", ...]` to control its filter membership and displayed capability tags. Every value must match an `id` from a `[[capabilities]]` block. Optional `paper` and `tutorial` fields can be omitted.

Organization Slack links are generated from the optional `slack_channels = ["#channel-name"]` list.

Each `[[talks]]` block appears on the JuliaCon talks page. Its `organization` must match an organization `id`; edit `youtube_url` to replace the embedded video.

## Local preview

```sh
npm ci
npm run dev
```

## Deployment

GitHub Actions builds, tests, and publishes the static site at
<https://juliahealth.github.io/JuliaLifeSciences/> on every push to `main`.
In the repository settings, select **GitHub Actions** as the Pages source once;
after that, editing and pushing only `content.toml` publishes the updated site.

The workflow uses GitHub's artifact-based Pages deployment, so no generated
`gh-pages` branch is required.
