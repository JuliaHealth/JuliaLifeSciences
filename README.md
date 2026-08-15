# JuliaLifeSciences website

The public site content lives in [`content.toml`](content.toml). Edit that one file to change:

- hero and section copy;
- organizations and their logos;
- capabilities;
- package order, descriptions, logos, repositories, papers, tutorials, tags, and stars;
- testimonials, names, roles, and organizations.

Each capability carousel uses its `packages = [...]` list. Reorder those names or add another showcased package name to change a carousel without touching the code. Package details come from the matching `[[packages]]` block; optional `paper` and `tutorial` fields can be omitted.

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
