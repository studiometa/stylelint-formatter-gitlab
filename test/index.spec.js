import { describe, it, expect, beforeEach, afterEach, spyOn } from 'bun:test';
import { existsSync, readFileSync, unlinkSync } from 'node:fs';
import path from 'node:path';
import stylelint from 'stylelint';
import gitlabFormatter from '../src/index.js';

// eslint-disable-next-line no-empty-function
const noop = () => {};

// Store original env values
const savedEnv = {};
const envKeys = [
  'CI_PROJECT_DIR',
  'CI_CONFIG_PATH',
  'CI_JOB_NAME',
  'STYLELINT_CODE_QUALITY_REPORT',
  'STYLELINT_FORMATTER',
];

beforeEach(() => {
  for (const key of envKeys) {
    savedEnv[key] = process.env[key];
  }

  process.env.CI_PROJECT_DIR = import.meta.dirname;
  process.env.CI_CONFIG_PATH = '__fixtures__/.gitlab-ci.yml';
  process.env.STYLELINT_FORMATTER = 'string';
});

afterEach(() => {
  for (const key of envKeys) {
    if (savedEnv[key] === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = savedEnv[key];
    }
  }
});

/**
 * Helper to wait for the async formatter resolution inside gitlabFormatter.
 * @returns {Promise<void>}
 */
function waitForFormatter() {
  return new Promise((resolve) => setTimeout(resolve, 200));
}

describe('gitlabFormatter', () => {
  it('should export a function', () => {
    expect(typeof gitlabFormatter).toBe('function');
  });

  it('should write a code quality report when STYLELINT_CODE_QUALITY_REPORT is set', async () => {
    const outputPath = path.join(import.meta.dirname, 'gl-codequality-test.json');
    process.env.STYLELINT_CODE_QUALITY_REPORT = outputPath;
    delete process.env.CI_JOB_NAME;

    const logSpy = spyOn(console, 'log').mockImplementation(noop);

    try {
      const results = [
        {
          source: path.join(import.meta.dirname, 'app.css'),
          warnings: [
            {
              line: 10,
              column: 5,
              text: 'Test error (test-rule)',
              rule: 'test-rule',
              severity: 'error',
            },
          ],
        },
      ];

      const returnValue = {
        cwd: process.cwd(),
        results,
        errored: false,
        report: '',
        reportedDisables: [],
        ruleMetadata: {},
      };

      gitlabFormatter(results, returnValue);
      await waitForFormatter();

      expect(existsSync(outputPath)).toBe(true);

      const report = JSON.parse(readFileSync(outputPath, 'utf-8'));
      expect(report).toHaveLength(1);
      expect(report[0]).toMatchObject({
        type: 'issue',
        check_name: 'test-rule',
        severity: 'major',
        description: 'Test error (test-rule)',
        location: {
          path: 'app.css',
          lines: { begin: 10, end: 10 },
        },
      });
      expect(report[0].fingerprint).toBeString();
    } finally {
      if (existsSync(outputPath)) unlinkSync(outputPath);
      logSpy.mockRestore();
    }
  });

  it('should not write a report without CI_JOB_NAME or STYLELINT_CODE_QUALITY_REPORT', async () => {
    delete process.env.CI_JOB_NAME;
    delete process.env.STYLELINT_CODE_QUALITY_REPORT;

    const logSpy = spyOn(console, 'log').mockImplementation(noop);

    try {
      const returnValue = {
        cwd: process.cwd(),
        results: [],
        errored: false,
        report: '',
        reportedDisables: [],
        ruleMetadata: {},
      };

      gitlabFormatter([], returnValue);
      await waitForFormatter();

      // console.log should be called with the fallback formatter output
      expect(logSpy).toHaveBeenCalled();
    } finally {
      logSpy.mockRestore();
    }
  });

  it('should call process.exit(1) when errored is true', async () => {
    delete process.env.CI_JOB_NAME;
    delete process.env.STYLELINT_CODE_QUALITY_REPORT;

    const exitSpy = spyOn(process, 'exit').mockImplementation(noop);
    const logSpy = spyOn(console, 'log').mockImplementation(noop);

    try {
      const returnValue = {
        cwd: process.cwd(),
        results: [],
        errored: true,
        report: '',
        reportedDisables: [],
        ruleMetadata: {},
      };

      gitlabFormatter([], returnValue);
      await waitForFormatter();

      expect(exitSpy).toHaveBeenCalledWith(1);
    } finally {
      exitSpy.mockRestore();
      logSpy.mockRestore();
    }
  });

  it('should not call process.exit when errored is false', async () => {
    delete process.env.CI_JOB_NAME;
    delete process.env.STYLELINT_CODE_QUALITY_REPORT;

    const exitSpy = spyOn(process, 'exit').mockImplementation(noop);
    const logSpy = spyOn(console, 'log').mockImplementation(noop);

    try {
      const returnValue = {
        cwd: process.cwd(),
        results: [],
        errored: false,
        report: '',
        reportedDisables: [],
        ruleMetadata: {},
      };

      gitlabFormatter([], returnValue);
      await waitForFormatter();

      expect(exitSpy).not.toHaveBeenCalled();
    } finally {
      exitSpy.mockRestore();
      logSpy.mockRestore();
    }
  });

  it('should use the STYLELINT_FORMATTER env var as fallback formatter', async () => {
    delete process.env.CI_JOB_NAME;
    delete process.env.STYLELINT_CODE_QUALITY_REPORT;
    process.env.STYLELINT_FORMATTER = 'json';

    const logSpy = spyOn(console, 'log').mockImplementation(noop);

    try {
      const returnValue = {
        cwd: process.cwd(),
        results: [],
        errored: false,
        report: '',
        reportedDisables: [],
        ruleMetadata: {},
      };

      gitlabFormatter([], returnValue);
      await waitForFormatter();

      expect(logSpy).toHaveBeenCalled();
      // JSON formatter should output valid JSON (empty array for no results)
      const output = logSpy.mock.calls[0][0];
      expect(() => JSON.parse(output)).not.toThrow();
    } finally {
      logSpy.mockRestore();
    }
  });

  it('should write a report with multiple warnings from multiple files', async () => {
    const outputPath = path.join(import.meta.dirname, 'gl-codequality-multi.json');
    process.env.STYLELINT_CODE_QUALITY_REPORT = outputPath;
    delete process.env.CI_JOB_NAME;

    const logSpy = spyOn(console, 'log').mockImplementation(noop);

    try {
      const results = [
        {
          source: path.join(import.meta.dirname, 'file-a.css'),
          warnings: [
            { line: 1, column: 1, text: 'Error A1', rule: 'rule-a', severity: 'error' },
            { line: 5, column: 1, text: 'Warning A2', rule: 'rule-b', severity: 'warning' },
          ],
        },
        {
          source: path.join(import.meta.dirname, 'file-b.css'),
          warnings: [{ line: 10, column: 1, text: 'Error B1', rule: 'rule-c', severity: 'error' }],
        },
      ];

      const returnValue = {
        cwd: process.cwd(),
        results,
        errored: false,
        report: '',
        reportedDisables: [],
        ruleMetadata: {},
      };

      gitlabFormatter(results, returnValue);
      await waitForFormatter();

      expect(existsSync(outputPath)).toBe(true);

      const report = JSON.parse(readFileSync(outputPath, 'utf-8'));
      expect(report).toHaveLength(3);
      expect(report[0].severity).toBe('major');
      expect(report[0].location.path).toBe('file-a.css');
      expect(report[1].severity).toBe('minor');
      expect(report[1].location.path).toBe('file-a.css');
      expect(report[2].severity).toBe('major');
      expect(report[2].location.path).toBe('file-b.css');
    } finally {
      if (existsSync(outputPath)) unlinkSync(outputPath);
      logSpy.mockRestore();
    }
  });
});

describe('stylelint.formatters compatibility', () => {
  it('should have all expected built-in formatters available as Promises', async () => {
    const expectedFormatters = ['compact', 'json', 'string', 'tap', 'unix', 'verbose'];

    for (const name of expectedFormatters) {
      expect(name in stylelint.formatters).toBe(true);
      const formatter = await stylelint.formatters[name];
      expect(typeof formatter).toBe('function');
    }
  });

  it('should have formatters that accept (results, returnValue) signature', async () => {
    const formatter = await stylelint.formatters.string;

    const output = formatter([], {
      cwd: process.cwd(),
      results: [],
      errored: false,
      report: '',
      reportedDisables: [],
      ruleMetadata: {},
    });

    expect(typeof output).toBe('string');
  });
});
