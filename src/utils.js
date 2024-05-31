import { createHash } from 'node:crypto';
import { join, resolve, relative } from 'node:path';
import { readFileSync } from 'node:fs';
import isGlob from 'is-glob';
import yaml from 'js-yaml';

/**
 * Get environment variables with sane defaults.
 * @returns {import('./types.d.ts').Env}
 */
export function getEnv() {
  const {
    // Used as a fallback for local testing.
    CI_CONFIG_PATH = '.gitlab-ci.yml',
    CI_JOB_NAME,
    CI_PROJECT_DIR = process.cwd(),
    STYLELINT_CODE_QUALITY_REPORT,
    STYLELINT_FORMATTER = 'string',
  } = process.env;

  return {
    CI_CONFIG_PATH,
    CI_JOB_NAME,
    CI_PROJECT_DIR,
    STYLELINT_CODE_QUALITY_REPORT,
    STYLELINT_FORMATTER,
  };
}

/**
 * Get the output path.
 * @returns {string}
 */
export function getOutputPath() {
  const { CI_PROJECT_DIR, CI_CONFIG_PATH, CI_JOB_NAME } = getEnv();
  const jobs = yaml.load(readFileSync(join(CI_PROJECT_DIR, CI_CONFIG_PATH), 'utf-8'));
  const { artifacts } = jobs[CI_JOB_NAME];
  const location = artifacts && artifacts.reports && artifacts.reports.codequality;
  const msg = `Expected ${CI_JOB_NAME}.artifacts.reports.codequality to be one exact path`;
  if (location === null || location === undefined) {
    throw new Error(`${msg}, but no value was found.`);
  }
  if (Array.isArray(location)) {
    throw new Error(`${msg}, but found an array instead.`);
  }
  if (typeof location !== 'string') {
    throw new Error(`${msg}, but found ${JSON.stringify(location)} instead.`);
  }
  if (isGlob(location)) {
    throw new Error(`${msg}, but found a glob instead.`);
  }
  return resolve(CI_PROJECT_DIR, location);
}

/**
 * Create fingerprint.
 * @param   {string} filePath
 * @param   {string} message
 * @returns {string}
 */
export function createFingerprint(filePath, message) {
  const md5 = createHash('md5');
  md5.update(filePath);
  if (message.rule) {
    md5.update(message.rule);
  }
  md5.update(message.text);
  return md5.digest('hex');
}

/**
 * Map severity.
 * @param   {string} severity
 * @returns {string}
 */
export function mapSeverity(severity) {
  switch (severity) {
    case 'error':
      return 'major';
    case 'warning':
      return 'minor';
    default:
      return 'minor';
  }
}

/**
 * @param {import('stylelint').Warning[]} results
 * @param {string} source
 * @returns {import('./types.d.ts').CodeQualityReport[]}
 */
function formatter(results, source) {
  const { CI_PROJECT_DIR } = getEnv();
  const relativePath = relative(CI_PROJECT_DIR, source);
  return results.map((result) => ({
    type: 'issue',
    check_name: result.rule,
    severity: mapSeverity(result.severity),
    description: result.text,
    fingerprint: createFingerprint(relativePath, result),
    location: {
      path: relativePath,
      lines: {
        begin: result.line,
        end: result.line,
      },
    },
  }));
}

/**
 * @param {import('stylelint').LintResult[]} results
 * @returns {object[]}
 */
export function convert(results) {
  return results.reduce(
    (acc, result) => [...acc, ...formatter(result.warnings, result.source)],
    [],
  );
}
