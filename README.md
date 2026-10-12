# @studiometa/stylelint-formatter-gitlab

[![NPM Version](https://img.shields.io/npm/v/@studiometa/stylelint-formatter-gitlab.svg?style=flat&colorB=3e63dd&colorA=414853)](https://www.npmjs.com/package/@studiometa/stylelint-formatter-gitlab/)
[![Downloads](https://img.shields.io/npm/dm/@studiometa/stylelint-formatter-gitlab?style=flat&colorB=3e63dd&colorA=414853)](https://www.npmjs.com/package/@studiometa/stylelint-formatter-gitlab/)
[![Size](https://img.shields.io/bundlephobia/minzip/@studiometa/stylelint-formatter-gitlab?style=flat&colorB=3e63dd&colorA=414853&label=size)](https://bundlephobia.com/package/@studiometa/stylelint-formatter-gitlab)
[![Dependency Status](https://img.shields.io/librariesio/release/npm/@studiometa/stylelint-formatter-gitlab?style=flat&colorB=3e63dd&colorA=414853)](https://david-dm.org/studiometa/stylelint-formatter-gitlab)

> Format StyleLint errors for Gitlab Code Quality reports.

## Installation

Install the package with NPM:

```bash
npm install -D stylelint@16 @studiometa/stylelint-formatter-gitlab
```

## Usage

Define a GitLab job to run `stylelint`.

_.gitlab-ci.yml_:

```yaml
stylelint:
  image: node
  script:
    - npm ci
    - npx stylelint --custom-formatter=@studiometa/stylelint-formatter-gitlab .
  artifacts:
    reports:
      codequality: gl-codequality.json
```

The formatter will automatically detect a GitLab CI environment. It will detect where to output the
code quality report based on the GitLab configuration file.

## Configuration Options

StyleLint formatters don’t take any configuration options. In order to still allow some way of
configuration, options are passed using environment variables.

| Environment Variable            | Description                                                                                                                                                    |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `STYLELINT_CODE_QUALITY_REPORT` | The location to store the code quality report. By default it will detect the location of the codequality artifact defined in the GitLab CI configuration file. |
| `STYLELINT_FORMATTER`           | The Stylelint formatter to use for the console output. This defaults to string, the default Stylelint formatter.                                               |

## Contributing

Do not edit `CHANGELOG.md`. Each pull request adds a fragment in `.changelog/<slug>.md`, where the slug is the branch name without its prefix (`feature/foo` → `foo.md`). A fragment only contains `### Added|Changed|Deprecated|Removed|Fixed|Security|Dependencies` headings, each followed by its entries:

```markdown
### Fixed

- Fix the exit code on lint errors
```

Do not write the pull request number: the release adds it. A pull request that changes `src/` needs a fragment, unless it has the `no-changelog` label (tests, refactors, tooling). See [`weareikko/changelog`](https://github.com/weareikko/changelog) for the format.

Maintainers release with the `Release` workflow, which bumps the version, folds the fragments into `CHANGELOG.md`, commits, tags, publishes to npm and creates the GitHub release:

```bash
gh workflow run publish.yml -f bump=patch # or minor / major
```

The `prepatch`, `preminor`, `premajor` and `prerelease` bumps create a prerelease, with the `preid` input as identifier (`alpha` by default, or `beta` / `rc`). A prerelease goes to the `next` dist-tag on npm and is a prerelease on GitHub. Any other version goes to the `latest` dist-tag:

```bash
gh workflow run publish.yml -f bump=preminor -f preid=beta # 1.2.0-beta.0
gh workflow run publish.yml -f bump=prerelease -f preid=beta # 1.2.0-beta.1
gh workflow run publish.yml -f bump=patch # 1.2.0, stable release of the prerelease
```

The stable release of a prerelease can have no new fragment: its GitHub release then says `Stable release of <prerelease version>.`

The workflow publishes with npm trusted publishing: it needs no npm token. If the publish job fails, use "Re-run failed jobs": npm skips a version that it already has, and the GitHub release is updated when it exists.

## Notes

This project is based on the [`stylelint-formatter-gitlab`](https://gitlab.com/leon0399/stylelint-formatter-gitlab) package which seems unmaintained and does not support StyleLint v16.
