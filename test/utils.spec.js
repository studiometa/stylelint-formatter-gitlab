import { describe, it, expect } from 'bun:test';
import path from 'node:path';
import { getOutputPath, convert, createFingerprint } from '../src/utils.js';

process.env.CI_PROJECT_DIR = import.meta.dirname;
process.env.CI_CONFIG_PATH = '__fixtures__/.gitlab-ci.yml';

describe('getOutputPath', () => {
  it('should detect the output path from the GitLab CI environment', () => {
    process.env.CI_JOB_NAME = 'eslint';
    expect(getOutputPath()).toBe(path.join(import.meta.dirname, 'gl-codequality.json'));
  });

  it('should throw an error if no codequality output was detected', () => {
    process.env.CI_JOB_NAME = 'missing-code-quality';
    expect(getOutputPath).toThrow(
      'Expected missing-code-quality.artifacts.reports.codequality to be one exact path, but no value was found.',
    );
  });

  it('should throw an error if the codequality output is an array', () => {
    process.env.CI_JOB_NAME = 'array-code-quality';
    expect(getOutputPath).toThrow(
      'Expected array-code-quality.artifacts.reports.codequality to be one exact path, but found an array instead.',
    );
  });

  it('should throw an error if the codequality output is not a string', () => {
    process.env.CI_JOB_NAME = 'non-string-code-quality';
    expect(getOutputPath).toThrow(
      'Expected non-string-code-quality.artifacts.reports.codequality to be one exact path, but found 3 instead.',
    );
  });

  it('should throw an error if the codequality output is a glob', () => {
    process.env.CI_JOB_NAME = 'glob-code-quality';
    expect(getOutputPath).toThrow(
      'Expected glob-code-quality.artifacts.reports.codequality to be one exact path, but found a glob instead.',
    );
  });
});

describe('createFingerprint', () => {
  it('should create an unique valid fingerprint for each error', () => {
    const result = createFingerprint('filemame.js', {
      line: 42,
      text: 'This is a linting error',
      rule: 'linting-error',
    });
    expect(result).toBe('4865d2b12aa92583749538a5c966fe61');

    const anotherResult = createFingerprint('filemame.js', {
      line: 42,
      text: 'This is a linting error',
      rule: 'new-linting-error',
    });
    expect(anotherResult).not.toBe('4865d2b12aa92583749538a5c966fe61');
  });
  it('should stay same when moving error between lines', () => {
    const result = createFingerprint('filemame.js', {
      line: 42,
      text: 'This is a linting error',
      rule: 'linting-error',
    });
    const anotherResult = createFingerprint('filemame.js', {
      line: 40,
      text: 'This is a linting error',
      rule: 'linting-error',
    });

    expect(result).toBe(anotherResult);
  });
});

describe('convert', () => {
  it('should convert Stylelint messages into GitLab code quality messages', () => {
    const result = convert([
      {
        source: path.join(import.meta.dirname, 'filemame.js'),
        warnings: [
          { line: 42, text: 'This is a linting error', rule: 'linting-error', severity: 'error' },
        ],
      },
    ]);
    expect(result).toStrictEqual([
      {
        type: 'issue',
        check_name: 'linting-error',
        severity: 'major',
        description: 'This is a linting error',
        fingerprint: '4865d2b12aa92583749538a5c966fe61',
        location: { lines: { begin: 42, end: 42 }, path: 'filemame.js' },
      },
    ]);
  });

  it('should convert multiple Stylelint messages into GitLab code quality messages', () => {
    const result = convert([
      {
        source: path.join(import.meta.dirname, 'filemame.js'),
        warnings: [
          { line: 42, text: 'This is a linting error', rule: 'linting-error', severity: 'error' },
          {
            line: 44,
            text: 'This is another linting error',
            rule: 'other-linting-error',
            severity: 'warning',
          },
        ],
      },
    ]);
    expect(result).toStrictEqual([
      {
        type: 'issue',
        check_name: 'linting-error',
        severity: 'major',
        description: 'This is a linting error',
        fingerprint: '4865d2b12aa92583749538a5c966fe61',
        location: { lines: { begin: 42, end: 42 }, path: 'filemame.js' },
      },
      {
        type: 'issue',
        check_name: 'other-linting-error',
        severity: 'minor',
        description: 'This is another linting error',
        fingerprint: '6a6e153c60166dc5dd8a228468ee8512',
        location: { lines: { begin: 44, end: 44 }, path: 'filemame.js' },
      },
    ]);
  });
});
