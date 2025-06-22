/**
 * テスト用のIssueフィクスチャデータ
 */

export const issueFixtures = {
  valid: {
    infrastructure: {
      title: "Set up CI/CD pipeline",
      description: "Configure GitHub Actions for automated testing and deployment",
      labels: ["infrastructure", "automation", "high-priority"],
      priority: "high",
      assignee: null,
      milestone: null
    },
    
    feature: {
      title: "Add user dashboard",
      description: "Create a comprehensive dashboard for user statistics and analytics",
      labels: ["enhancement", "frontend", "medium-priority"],
      priority: "medium",
      assignee: "developer1",
      milestone: "v1.1.0"
    },
    
    bugfix: {
      title: "Fix navigation menu responsiveness",
      description: "The navigation menu doesn't collapse properly on mobile devices",
      labels: ["bug", "frontend", "mobile", "high-priority"],
      priority: "high",
      assignee: "developer2",
      milestone: "v1.0.1"
    },
    
    documentation: {
      title: "Update API documentation",
      description: "Add comprehensive examples and error handling documentation",
      labels: ["documentation", "api", "low-priority"],
      priority: "low",
      assignee: null,
      milestone: null
    }
  },
  
  invalid: {
    missingTitle: {
      description: "This issue has no title",
      labels: ["bug"],
      priority: "medium"
    },
    
    emptyLabels: {
      title: "Issue with no labels",
      description: "This issue should fail validation due to empty labels",
      labels: [],
      priority: "low"
    },
    
    invalidPriority: {
      title: "Issue with invalid priority",
      description: "This issue has an invalid priority value",
      labels: ["enhancement"],
      priority: "extreme"
    },
    
    missingDescription: {
      title: "Issue without description",
      labels: ["bug"],
      priority: "medium"
    }
  },
  
  // GitHub API レスポンス形式のモックデータ
  githubApiResponse: {
    created: {
      number: 123,
      id: 1234567890,
      title: "Set up CI/CD pipeline",
      body: "Configure GitHub Actions for automated testing and deployment",
      state: "open",
      labels: [
        { name: "infrastructure", color: "0366d6" },
        { name: "automation", color: "008672" },
        { name: "high-priority", color: "d93f0b" }
      ],
      assignee: null,
      assignees: [],
      milestone: null,
      html_url: "https://github.com/test-owner/test-repo/issues/123",
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
      closed_at: null,
      user: {
        login: "test-user",
        id: 12345,
        avatar_url: "https://github.com/images/error/test-user_happy.gif"
      }
    },
    
    existing: {
      number: 456,
      id: 9876543210,
      title: "Add user dashboard",
      body: "Create a comprehensive dashboard for user statistics and analytics",
      state: "open",
      labels: [
        { name: "enhancement", color: "a2eeef" },
        { name: "frontend", color: "d4c5f9" },
        { name: "medium-priority", color: "fbca04" }
      ],
      assignee: {
        login: "developer1",
        id: 67890
      },
      assignees: [
        {
          login: "developer1",
          id: 67890
        }
      ],
      milestone: {
        number: 1,
        title: "v1.1.0"
      },
      html_url: "https://github.com/test-owner/test-repo/issues/456",
      created_at: "2024-01-02T00:00:00Z",
      updated_at: "2024-01-02T12:00:00Z",
      closed_at: null,
      user: {
        login: "test-user",
        id: 12345,
        avatar_url: "https://github.com/images/error/test-user_happy.gif"
      }
    }
  },
  
  // バッチ作成用のテストデータ
  batch: [
    {
      title: "Implement user authentication",
      description: "Add OAuth2 authentication system",
      labels: ["enhancement", "security", "backend"],
      priority: "high"
    },
    {
      title: "Create responsive design",
      description: "Make the application mobile-friendly",
      labels: ["enhancement", "frontend", "mobile"],
      priority: "medium"
    },
    {
      title: "Add performance monitoring",
      description: "Implement application performance monitoring",
      labels: ["infrastructure", "monitoring"],
      priority: "low"
    }
  ]
};

// テストデータ生成ヘルパー関数
export function generateTestIssue(overrides = {}) {
  return {
    ...issueFixtures.valid.infrastructure,
    ...overrides,
    title: overrides.title || `Test Issue ${Date.now()}`,
    description: overrides.description || `Test description ${Date.now()}`
  };
}

export function generateBatchTestIssues(count = 5) {
  return Array.from({ length: count }, (_, index) => generateTestIssue({
    title: `Batch Test Issue ${index + 1}`,
    description: `Batch test description ${index + 1}`
  }));
}