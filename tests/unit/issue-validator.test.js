/**
 * Issue バリデーター ユニットテスト
 */

import { describe, it, expect } from '@jest/globals';
import { issueFixtures, generateTestIssue } from '../fixtures/issues.js';

// バリデーター関数（実装予定）
function validateIssue(issue) {
  if (!issue) {
    throw new Error('Issue is required');
  }

  if (!issue.title || typeof issue.title !== 'string' || issue.title.trim() === '') {
    throw new Error('Issue title is required');
  }

  const description = issue.description || issue.body;
  if (!description || typeof description !== 'string' || description.trim() === '') {
    throw new Error('Issue description is required');
  }

  if (!Array.isArray(issue.labels) || issue.labels.length === 0) {
    throw new Error('Issue must have at least one label');
  }

  const validPriorities = ['low', 'medium', 'high'];
  if (issue.priority && !validPriorities.includes(issue.priority)) {
    throw new Error('Issue must have a valid priority (low, medium, high)');
  }

  return true;
}

function validateIssueLabels(labels) {
  if (!Array.isArray(labels)) {
    return false;
  }

  // 必須ラベルの検証
  const hasTypeLabel = labels.some(label =>
    ['bug', 'enhancement', 'documentation', 'infrastructure'].includes(label)
  );

  const hasPriorityLabel = labels.some(label =>
    ['low-priority', 'medium-priority', 'high-priority'].includes(label)
  );

  return hasTypeLabel && hasPriorityLabel;
}

describe('Issue Validator', () => {
  describe('validateIssue', () => {
    it('should validate a valid issue structure', () => {
      const validIssue = issueFixtures.valid.infrastructure;
      expect(() => validateIssue(validIssue)).not.toThrow();
      expect(validateIssue(validIssue)).toBe(true);
    });

    it('should reject issue without title', () => {
      const invalidIssue = issueFixtures.invalid.missingTitle;
      expect(() => validateIssue(invalidIssue)).toThrow('Issue title is required');
    });

    it('should reject issue without description', () => {
      const invalidIssue = issueFixtures.invalid.missingDescription;
      expect(() => validateIssue(invalidIssue)).toThrow('Issue description is required');
    });

    it('should reject issue with empty labels', () => {
      const invalidIssue = issueFixtures.invalid.emptyLabels;
      expect(() => validateIssue(invalidIssue)).toThrow('Issue must have at least one label');
    });

    it('should reject issue with invalid priority', () => {
      const invalidIssue = issueFixtures.invalid.invalidPriority;
      expect(() => validateIssue(invalidIssue)).toThrow(
        'Issue must have a valid priority (low, medium, high)'
      );
    });

    it('should reject null or undefined issue', () => {
      expect(() => validateIssue(null)).toThrow('Issue is required');
      expect(() => validateIssue(undefined)).toThrow('Issue is required');
    });

    it('should reject issue with empty title', () => {
      const issueWithEmptyTitle = {
        ...issueFixtures.valid.infrastructure,
        title: ''
      };
      expect(() => validateIssue(issueWithEmptyTitle)).toThrow('Issue title is required');
    });

    it('should reject issue with whitespace-only title', () => {
      const issueWithWhitespaceTitle = {
        ...issueFixtures.valid.infrastructure,
        title: '   '
      };
      expect(() => validateIssue(issueWithWhitespaceTitle)).toThrow('Issue title is required');
    });
  });

  describe('validateIssueLabels', () => {
    it('should validate labels with type and priority', () => {
      const validLabels = ['enhancement', 'frontend', 'high-priority'];
      expect(validateIssueLabels(validLabels)).toBe(true);
    });

    it('should reject labels without type', () => {
      const labelsWithoutType = ['frontend', 'high-priority'];
      expect(validateIssueLabels(labelsWithoutType)).toBe(false);
    });

    it('should reject labels without priority', () => {
      const labelsWithoutPriority = ['enhancement', 'frontend'];
      expect(validateIssueLabels(labelsWithoutPriority)).toBe(false);
    });

    it('should reject non-array labels', () => {
      expect(validateIssueLabels('not-array')).toBe(false);
      expect(validateIssueLabels(null)).toBe(false);
      expect(validateIssueLabels(undefined)).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long titles', () => {
      const longTitle = 'A'.repeat(1000);
      const issueWithLongTitle = generateTestIssue({ title: longTitle });
      expect(() => validateIssue(issueWithLongTitle)).not.toThrow();
    });

    it('should handle special characters in title', () => {
      const specialTitle = 'Fix #123: Handle UTF-8 characters 日本語 🚀';
      const issueWithSpecialTitle = generateTestIssue({ title: specialTitle });
      expect(() => validateIssue(issueWithSpecialTitle)).not.toThrow();
    });

    it('should handle multiple labels of same type', () => {
      const multipleLabels = ['enhancement', 'bug', 'high-priority', 'medium-priority'];
      const issueWithMultipleLabels = generateTestIssue({ labels: multipleLabels });
      expect(() => validateIssue(issueWithMultipleLabels)).not.toThrow();
    });
  });

  describe('Custom Matchers', () => {
    it('should validate issue using custom validation', () => {
      const validIssue = issueFixtures.valid.feature;
      expect(() => validateIssue(validIssue)).not.toThrow();
    });

    it('should fail validation for invalid issue', () => {
      const invalidIssue = issueFixtures.invalid.missingTitle;
      expect(() => validateIssue(invalidIssue)).toThrow();
    });
  });
});
