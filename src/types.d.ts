import type { Formatters } from 'stylelint';

export interface FileInfo {
  filename: string;
  input: string;
  output: string;
  isFormatted: boolean;
}

export interface CodeQualityReport {
  type: 'issue';
  check_name: string;
  description: string;
  severity: string;
  fingerprint: string;
  location: {
    path: string;
    lines: {
      begin: number;
      end: number;
    };
  };
}

export interface Env {
  CI_CONFIG_PATH: string;
  CI_JOB_NAME: string;
  CI_PROJECT_DIR: string;
  STYLELINT_CODE_QUALITY_REPORT: string;
  STYLELINT_FORMATTER: keyof Formatters;
}
