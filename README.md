# StyleLint formatter for GitLab Code Quality

[![NPM Version](https://img.shields.io/npm/v/@studiometa/stylelint-formatter-gitlab.svg?style=flat-square)](https://www.npmjs.com/package/@studiometa/stylelint-formatter-gitlab/)

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

## Notes

This project is based on the [`stylelint-formatter-gitlab`](https://gitlab.com/leon0399/stylelint-formatter-gitlab) package which seems unmaintained and does not support StyleLint v16.
