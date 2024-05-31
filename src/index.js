import { writeFileSync } from 'node:fs';
import stylelint from 'stylelint';
import { getOutputPath, convert, getEnv } from './utils.js';

/**
 * GitLab formatter.
 * @param {import('stylelint').LintResult[]} results
 * @param {import('stylelint').LinterResult} returnValue
 * @returns {void}
 */
export default function gitlabFormatter(results, returnValue) {
  const { CI_JOB_NAME, STYLELINT_CODE_QUALITY_REPORT, STYLELINT_FORMATTER } = getEnv();

  if (CI_JOB_NAME || STYLELINT_CODE_QUALITY_REPORT) {
    writeFileSync(
      STYLELINT_CODE_QUALITY_REPORT || getOutputPath(),
      JSON.stringify(convert(results), null, 2),
    );
  }

  stylelint.formatters[STYLELINT_FORMATTER].then((fallbackFormatter) => {
    console.log(fallbackFormatter(results, returnValue));
  });
}
