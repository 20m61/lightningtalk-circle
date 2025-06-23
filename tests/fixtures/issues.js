/**
 * テスト用のIssueフィクスチャデータ
 */

export const issueFixtures = {
  valid: {
    infrastructure: {
      id: 1,
      title: 'Set up CI/CD pipeline',
      body: 'Configure GitHub Actions for automated testing and deployment',
      state: 'open',
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
      user: { login: 'test-user' },
      labels: [{ name: 'infrastructure' }, { name: 'automation' }],
      assignees: [],
      comments: 0,
      number: 1
    },

    feature: {
      id: 2,
      title: 'Add user dashboard',
      body: 'Create a comprehensive dashboard for user statistics and analytics',
      state: 'open',
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
      user: { login: 'test-user' },
      labels: [{ name: 'enhancement' }, { name: 'frontend' }],
      assignees: [{ login: 'developer1' }],
      comments: 2,
      number: 2
    },

    bugfix: {
      id: 3,
      title: 'Fix navigation menu responsiveness',
      body: "The navigation menu doesn't collapse properly on mobile devices",
      state: 'open',
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
      user: { login: 'test-user' },
      labels: [{ name: 'bug' }, { name: 'frontend' }, { name: 'mobile' }],
      assignees: [{ login: 'developer2' }],
      comments: 1,
      number: 3
    },

    documentation: {
      id: 4,
      title: 'Update API documentation',
      body: 'Add comprehensive examples and error handling documentation',
      state: 'open',
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
      user: { login: 'test-user' },
      labels: [{ name: 'documentation' }, { name: 'api' }],
      assignees: [],
      comments: 0,
      number: 4
    }
  },

  invalid: {
    missingTitle: {
      id: 5,
      body: 'This issue has no title',
      state: 'open',
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
      user: { login: 'test-user' },
      labels: [{ name: 'bug' }],
      assignees: [],
      comments: 0,
      number: 5,
      description: 'This issue has no title',
      priority: 'medium'
    },

    emptyLabels: {
      id: 6,
      title: 'Issue with no labels',
      body: 'This issue should fail validation due to empty labels',
      state: 'open',
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
      user: { login: 'test-user' },
      labels: [],
      assignees: [],
      comments: 0,
      number: 6,
      description: 'This issue should fail validation due to empty labels',
      priority: 'low'
    },

    invalidPriority: {
      id: 7,
      title: 'Issue with invalid priority',
      body: 'This issue has an invalid priority value',
      state: 'open',
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
      user: { login: 'test-user' },
      labels: [{ name: 'enhancement' }],
      assignees: [],
      comments: 0,
      number: 7,
      description: 'This issue has an invalid priority value',
      priority: 'extreme'
    },

    missingDescription: {
      id: 8,
      title: 'Issue without description',
      state: 'open',
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
      user: { login: 'test-user' },
      labels: [{ name: 'bug' }],
      assignees: [],
      comments: 0,
      number: 8,
      priority: 'medium'
    }
  },

  // GitHub API レスポンス形式のモックデータ
  githubApiResponse: {
    created: {
      number: 123,
      id: 1234567890,
      title: 'Set up CI/CD pipeline',
      body: 'Configure GitHub Actions for automated testing and deployment',
      state: 'open',
      labels: [
        { name: 'infrastructure', color: '0366d6' },
        { name: 'automation', color: '008672' },
        { name: 'high-priority', color: 'd93f0b' }
      ],
      assignee: null,
      assignees: [],
      milestone: null,
      html_url: 'https://github.com/test-owner/test-repo/issues/123',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      closed_at: null,
      user: {
        login: 'test-user',
        id: 12345,
        avatar_url: 'https://github.com/images/error/test-user_happy.gif'
      }
    },

    existing: {
      number: 456,
      id: 9876543210,
      title: 'Add user dashboard',
      body: 'Create a comprehensive dashboard for user statistics and analytics',
      state: 'open',
      labels: [
        { name: 'enhancement', color: 'a2eeef' },
        { name: 'frontend', color: 'd4c5f9' },
        { name: 'medium-priority', color: 'fbca04' }
      ],
      assignee: {
        login: 'developer1',
        id: 67890
      },
      assignees: [
        {
          login: 'developer1',
          id: 67890
        }
      ],
      milestone: {
        number: 1,
        title: 'v1.1.0'
      },
      html_url: 'https://github.com/test-owner/test-repo/issues/456',
      created_at: '2024-01-02T00:00:00Z',
      updated_at: '2024-01-02T12:00:00Z',
      closed_at: null,
      user: {
        login: 'test-user',
        id: 12345,
        avatar_url: 'https://github.com/images/error/test-user_happy.gif'
      }
    }
  },

  // バッチ作成用のテストデータ
  batch: [
    {
      id: 101,
      title: 'Implement user authentication',
      body: 'Add OAuth2 authentication system',
      state: 'open',
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
      user: { login: 'test-user' },
      labels: [{ name: 'enhancement' }, { name: 'security' }, { name: 'backend' }],
      assignees: [],
      comments: 0,
      number: 101,
      description: 'Add OAuth2 authentication system',
      priority: 'high'
    },
    {
      id: 102,
      title: 'Create responsive design',
      body: 'Make the application mobile-friendly',
      state: 'open',
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
      user: { login: 'test-user' },
      labels: [{ name: 'enhancement' }, { name: 'frontend' }, { name: 'mobile' }],
      assignees: [],
      comments: 0,
      number: 102,
      description: 'Make the application mobile-friendly',
      priority: 'medium'
    },
    {
      id: 103,
      title: 'Add performance monitoring',
      body: 'Implement application performance monitoring',
      state: 'open',
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
      user: { login: 'test-user' },
      labels: [{ name: 'infrastructure' }, { name: 'monitoring' }],
      assignees: [],
      comments: 0,
      number: 103,
      description: 'Implement application performance monitoring',
      priority: 'low'
    }
  ]
};

// テストデータ生成ヘルパー関数
export function generateTestIssue(overrides = {}) {
  return {
    ...issueFixtures.valid.infrastructure,
    ...overrides,
    title: overrides.title || `Test Issue ${Date.now()}`,
    body: overrides.body || overrides.description || `Test description ${Date.now()}`,
    description: overrides.description || overrides.body || `Test description ${Date.now()}`,
    priority: overrides.priority || 'medium'
  };
}

export function generateBatchTestIssues(count = 5) {
  return Array.from({ length: count }, (_, index) =>
    generateTestIssue({
      title: `Batch Test Issue ${index + 1}`,
      description: `Batch test description ${index + 1}`
    })
  );
}
