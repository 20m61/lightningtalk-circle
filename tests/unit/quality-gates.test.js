import { jest } from '@jest/globals';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Mock dependencies
jest.mock('child_process');
jest.mock('fs');
jest.mock('path');
jest.mock('chalk', () => ({
  blue: jest.fn((text) => text),
  green: jest.fn((text) => text),
  yellow: jest.fn((text) => text),
  red: jest.fn((text) => text),
  cyan: jest.fn((text) => text),
  gray: jest.fn((text) => text),
  white: jest.fn((text) => text)
}));

// Import after mocking
import QualityGateSystem from '../../scripts/quality-gates.js';

describe('QualityGateSystem', () => {
  let qualityGates;
  let consoleSpy;

  beforeEach(() => {
    qualityGates = new QualityGateSystem();
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.clearAllMocks();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('constructor', () => {
    it('should initialize with default configuration', () => {
      expect(qualityGates.config.thresholds.coverage).toBe(80);
      expect(qualityGates.config.timeout).toBe(300000);
      expect(qualityGates.config.parallel).toBe(true);
    });

    it('should accept custom options', () => {
      const customGates = new QualityGateSystem({
        coverage: 90,
        timeout: 600000,
        parallel: false
      });
      
      expect(customGates.config.thresholds.coverage).toBe(90);
      expect(customGates.config.timeout).toBe(600000);
      expect(customGates.config.parallel).toBe(false);
    });
  });

  describe('runUnitTests', () => {
    it('should return successful result when tests pass', async () => {
      execSync.mockReturnValue('5 passing\n0 failing');

      const result = await qualityGates.runUnitTests();

      expect(result.passed).toBe(true);
      expect(result.score).toBe(100);
      expect(result.details.passing).toBe(5);
      expect(result.details.failing).toBe(0);
    });

    it('should return failed result when tests fail', async () => {
      execSync.mockReturnValue('3 passing\n2 failing');

      const result = await qualityGates.runUnitTests();

      expect(result.passed).toBe(false);
      expect(result.score).toBe(60);
      expect(result.details.passing).toBe(3);
      expect(result.details.failing).toBe(2);
    });

    it('should handle execution errors', async () => {
      execSync.mockImplementation(() => {
        throw new Error('Test execution failed');
      });

      const result = await qualityGates.runUnitTests();

      expect(result.passed).toBe(false);
      expect(result.score).toBe(0);
      expect(result.details.error).toBe('Test execution failed');
    });
  });

  describe('runIntegrationTests', () => {
    it('should return successful result when integration tests pass', async () => {
      execSync.mockReturnValue('8 passing\n0 failing');

      const result = await qualityGates.runIntegrationTests();

      expect(result.passed).toBe(true);
      expect(result.score).toBe(100);
      expect(result.details.passing).toBe(8);
      expect(result.details.failing).toBe(0);
    });

    it('should skip when integration tests not configured', async () => {
      execSync.mockImplementation(() => {
        const error = new Error('script not found');
        throw error;
      });

      const result = await qualityGates.runIntegrationTests();

      expect(result.passed).toBe(true);
      expect(result.score).toBe(100);
      expect(result.details.skipped).toBe('Integration tests not configured');
    });

    it('should handle other execution errors', async () => {
      execSync.mockImplementation(() => {
        throw new Error('Connection failed');
      });

      const result = await qualityGates.runIntegrationTests();

      expect(result.passed).toBe(false);
      expect(result.score).toBe(0);
      expect(result.details.error).toBe('Connection failed');
    });
  });

  describe('checkCodeCoverage', () => {
    it('should return successful result when coverage meets threshold', async () => {
      execSync.mockReturnValue('All files      |   85.5   |');

      const result = await qualityGates.checkCodeCoverage();

      expect(result.passed).toBe(true);
      expect(result.score).toBe(85.5);
      expect(result.details.coverage).toBe(85.5);
      expect(result.details.threshold).toBe(80);
    });

    it('should return failed result when coverage below threshold', async () => {
      execSync.mockReturnValue('All files      |   75.2   |');

      const result = await qualityGates.checkCodeCoverage();

      expect(result.passed).toBe(false);
      expect(result.score).toBe(75.2);
      expect(result.details.coverage).toBe(75.2);
    });

    it('should handle execution errors', async () => {
      execSync.mockImplementation(() => {
        throw new Error('Coverage tool failed');
      });

      const result = await qualityGates.checkCodeCoverage();

      expect(result.passed).toBe(false);
      expect(result.score).toBe(0);
      expect(result.details.error).toBe('Coverage tool failed');
    });
  });

  describe('checkCodeQuality', () => {
    it('should return successful result when quality checks pass', async () => {
      execSync.mockImplementation((cmd) => {
        if (cmd.includes('eslint')) {
          // Mock successful ESLint execution
          return '';
        }
        if (cmd.includes('prettier')) {
          // Mock successful Prettier execution
          return '';
        }
      });

      fs.readFileSync.mockReturnValue(JSON.stringify([
        { errorCount: 0, warningCount: 0 }
      ]));

      const result = await qualityGates.checkCodeQuality();

      expect(result.passed).toBe(true);
      expect(result.score).toBe(100);
    });

    it('should handle ESLint errors', async () => {
      execSync.mockImplementation((cmd) => {
        if (cmd.includes('eslint')) {
          throw new Error('ESLint failed');
        }
      });

      const result = await qualityGates.checkCodeQuality();

      expect(result.passed).toBe(false);
      expect(result.details.checks.some(check => 
        check.name === 'ESLint' && !check.passed
      )).toBe(true);
    });
  });

  describe('runSecurityScan', () => {
    it('should return successful result when no security issues found', async () => {
      execSync.mockReturnValue(JSON.stringify({
        metadata: {
          vulnerabilities: {
            critical: 0,
            high: 0,
            moderate: 0,
            low: 0
          }
        }
      }));

      fs.existsSync.mockReturnValue(true);
      fs.readdirSync.mockReturnValue([]);
      qualityGates.getAllJSFiles = jest.fn().mockReturnValue([]);

      const result = await qualityGates.runSecurityScan();

      expect(result.passed).toBe(true);
      expect(result.score).toBeGreaterThan(0);
    });

    it('should handle security vulnerabilities', async () => {
      execSync.mockImplementation(() => {
        const error = new Error('Vulnerabilities found');
        error.stdout = JSON.stringify({
          metadata: {
            vulnerabilities: {
              critical: 2,
              high: 1
            }
          }
        });
        throw error;
      });

      fs.existsSync.mockReturnValue(true);
      fs.readdirSync.mockReturnValue([]);
      qualityGates.getAllJSFiles = jest.fn().mockReturnValue([]);

      const result = await qualityGates.runSecurityScan();

      expect(result.passed).toBe(false);
      expect(result.details.checks.some(check => 
        check.name === 'npm audit' && !check.passed
      )).toBe(true);
    });
  });

  describe('checkSecurityPatterns', () => {
    it('should detect hardcoded secrets', () => {
      qualityGates.getAllJSFiles = jest.fn().mockReturnValue(['test.js']);
      fs.readFileSync.mockReturnValue('const password = "secret123";');

      const result = qualityGates.checkSecurityPatterns();

      expect(result.passed).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
      expect(result.issues[0]).toContain('Hardcoded password detected');
    });

    it('should pass when no security issues found', () => {
      qualityGates.getAllJSFiles = jest.fn().mockReturnValue(['test.js']);
      fs.readFileSync.mockReturnValue('const config = process.env.PASSWORD;');

      const result = qualityGates.checkSecurityPatterns();

      expect(result.passed).toBe(true);
      expect(result.issues.length).toBe(0);
    });
  });

  describe('runPerformanceTests', () => {
    it('should return successful result when performance tests pass', async () => {
      execSync.mockReturnValue('average response time: 500ms');

      const result = await qualityGates.runPerformanceTests();

      expect(result.passed).toBe(true);
      expect(result.score).toBeGreaterThan(50);
      expect(result.details.responseTime).toBe(500);
    });

    it('should skip when performance tests not configured', async () => {
      execSync.mockImplementation(() => {
        throw new Error('Performance tests not configured');
      });

      const result = await qualityGates.runPerformanceTests();

      expect(result.passed).toBe(true);
      expect(result.score).toBe(100);
      expect(result.details.skipped).toBe('Performance tests not configured');
    });
  });

  describe('checkDependencies', () => {
    it('should return successful result when dependencies are up to date', async () => {
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue(JSON.stringify({
        name: 'test-project',
        dependencies: { 'test-dep': '^1.0.0' }
      }));

      execSync.mockImplementation((cmd) => {
        if (cmd.includes('outdated')) {
          return '{}';
        }
        if (cmd.includes('audit fix')) {
          return 'No security updates needed';
        }
      });

      const result = await qualityGates.checkDependencies();

      expect(result.passed).toBe(true);
      expect(result.score).toBe(100);
    });

    it('should handle missing package.json', async () => {
      fs.existsSync.mockReturnValue(false);

      const result = await qualityGates.checkDependencies();

      expect(result.passed).toBe(false);
      expect(result.score).toBe(0);
      expect(result.details.error).toBe('package.json not found');
    });
  });

  describe('analyzeBundleSize', () => {
    it('should return successful result when bundle size is acceptable', async () => {
      qualityGates.getBundleStats = jest.fn().mockReturnValue({
        totalSize: 1024 * 1024, // 1MB
        breakdown: { src: 1024 * 1024 }
      });

      const result = await qualityGates.analyzeBundleSize();

      expect(result.passed).toBe(true);
      expect(result.score).toBeGreaterThan(0);
      expect(result.details.totalSize).toBe(1024 * 1024);
    });

    it('should handle bundle analysis errors', async () => {
      qualityGates.getBundleStats = jest.fn().mockImplementation(() => {
        throw new Error('Bundle analysis failed');
      });

      const result = await qualityGates.analyzeBundleSize();

      expect(result.passed).toBe(true);
      expect(result.score).toBe(100);
      expect(result.details.skipped).toBe('Bundle analysis not available');
    });
  });

  describe('utility methods', () => {
    describe('getAllJSFiles', () => {
      it('should return JavaScript files recursively', () => {
        fs.existsSync.mockReturnValue(true);
        fs.readdirSync.mockReturnValue([
          { name: 'test.js', isDirectory: () => false },
          { name: 'index.ts', isDirectory: () => false },
          { name: 'subdir', isDirectory: () => true }
        ]);

        const result = qualityGates.getAllJSFiles('src/');

        expect(result).toContain('src/test.js');
        expect(result).toContain('src/index.ts');
      });

      it('should return empty array for non-existent directory', () => {
        fs.existsSync.mockReturnValue(false);

        const result = qualityGates.getAllJSFiles('nonexistent/');

        expect(result).toEqual([]);
      });
    });

    describe('getDirectorySize', () => {
      it('should calculate directory size recursively', () => {
        fs.existsSync.mockReturnValue(true);
        fs.readdirSync.mockReturnValue([
          { name: 'file1.js', isDirectory: () => false },
          { name: 'file2.js', isDirectory: () => false }
        ]);
        fs.statSync.mockReturnValue({ size: 1024 });

        const result = qualityGates.getDirectorySize('src/');

        expect(result).toBe(2048); // 2 files * 1024 bytes each
      });

      it('should return 0 for non-existent directory', () => {
        fs.existsSync.mockReturnValue(false);

        const result = qualityGates.getDirectorySize('nonexistent/');

        expect(result).toBe(0);
      });
    });

    describe('isCriticalGate', () => {
      it('should identify critical gates', () => {
        expect(qualityGates.isCriticalGate('Unit Tests')).toBe(true);
        expect(qualityGates.isCriticalGate('Security Scan')).toBe(true);
        expect(qualityGates.isCriticalGate('Code Coverage')).toBe(false);
      });
    });

    describe('getRecommendations', () => {
      it('should return specific recommendations for known gates', () => {
        const recommendations = qualityGates.getRecommendations('Unit Tests');
        
        expect(recommendations).toContain('Fix failing unit tests');
        expect(recommendations).toContain('Add tests for uncovered code paths');
      });

      it('should return default recommendation for unknown gates', () => {
        const recommendations = qualityGates.getRecommendations('Unknown Gate');
        
        expect(recommendations).toContain('Review and fix identified issues');
      });
    });
  });

  describe('checkAccessibility', () => {
    it('should return successful result when accessibility checks pass', async () => {
      qualityGates.getAllHTMLFiles = jest.fn().mockReturnValue(['test.html']);
      qualityGates.validateHTMLAccessibility = jest.fn().mockReturnValue([
        { name: 'Alt attributes', passed: true },
        { name: 'Form labels', passed: true }
      ]);
      qualityGates.checkWCAGCompliance = jest.fn().mockReturnValue({
        name: 'WCAG Compliance',
        passed: true
      });

      const result = await qualityGates.checkAccessibility();

      expect(result.passed).toBe(true);
      expect(result.score).toBe(100);
    });

    it('should return failed result when accessibility issues found', async () => {
      qualityGates.getAllHTMLFiles = jest.fn().mockReturnValue(['test.html']);
      qualityGates.validateHTMLAccessibility = jest.fn().mockReturnValue([
        { name: 'Alt attributes', passed: false },
        { name: 'Form labels', passed: true }
      ]);
      qualityGates.checkWCAGCompliance = jest.fn().mockReturnValue({
        name: 'WCAG Compliance',
        passed: false
      });

      const result = await qualityGates.checkAccessibility();

      expect(result.passed).toBe(false);
      expect(result.score).toBeLessThan(100);
    });
  });

  describe('validateHTMLAccessibility', () => {
    it('should detect missing alt attributes', () => {
      const html = '<img src="test.jpg"><img src="test2.jpg" alt="test">';
      
      const result = qualityGates.validateHTMLAccessibility(html, 'test.html');
      
      const altCheck = result.find(check => check.name.includes('alt attributes'));
      expect(altCheck.passed).toBe(false);
      expect(altCheck.message).toContain('Found 1 img tags without alt attributes');
    });

    it('should pass when all images have alt attributes', () => {
      const html = '<img src="test.jpg" alt="Test image"><img src="test2.jpg" alt="Another test">';
      
      const result = qualityGates.validateHTMLAccessibility(html, 'test.html');
      
      const altCheck = result.find(check => check.name.includes('alt attributes'));
      expect(altCheck.passed).toBe(true);
    });

    it('should validate heading structure', () => {
      const invalidHtml = '<h1>Title</h1><h3>Skipped h2</h3>';
      const validHtml = '<h1>Title</h1><h2>Subtitle</h2><h3>Section</h3>';
      
      const invalidResult = qualityGates.validateHTMLAccessibility(invalidHtml, 'test.html');
      const validResult = qualityGates.validateHTMLAccessibility(validHtml, 'test.html');
      
      const invalidHeadingCheck = invalidResult.find(check => check.name.includes('Heading structure'));
      const validHeadingCheck = validResult.find(check => check.name.includes('Heading structure'));
      
      expect(invalidHeadingCheck.passed).toBe(false);
      expect(validHeadingCheck.passed).toBe(true);
    });
  });

  describe('checkWCAGCompliance', () => {
    it('should check interactive elements accessibility', () => {
      qualityGates.getAllHTMLFiles = jest.fn().mockReturnValue(['test.html']);
      fs.readFileSync.mockReturnValue('<button>Click me</button><input type="text" aria-label="Name">');

      const result = qualityGates.checkWCAGCompliance();

      expect(result.name).toBe('WCAG 2.1 AA Compliance');
      expect(result.details[0].name).toBe('Interactive elements accessibility');
    });
  });

  describe('getAllHTMLFiles', () => {
    it('should return HTML files recursively', () => {
      fs.existsSync.mockReturnValue(true);
      fs.readdirSync.mockReturnValue([
        { name: 'index.html', isDirectory: () => false },
        { name: 'about.html', isDirectory: () => false },
        { name: 'scripts', isDirectory: () => true },
        { name: 'style.css', isDirectory: () => false }
      ]);

      const result = qualityGates.getAllHTMLFiles('docs/');

      expect(result).toContain('docs/index.html');
      expect(result).toContain('docs/about.html');
      expect(result).not.toContain('docs/style.css');
    });

    it('should skip hidden directories and node_modules', () => {
      fs.existsSync.mockReturnValue(true);
      fs.readdirSync.mockReturnValue([
        { name: '.git', isDirectory: () => true },
        { name: 'node_modules', isDirectory: () => true },
        { name: 'index.html', isDirectory: () => false }
      ]);

      const result = qualityGates.getAllHTMLFiles('.');

      expect(result).toContain('./index.html');
      expect(result.some(file => file.includes('.git'))).toBe(false);
      expect(result.some(file => file.includes('node_modules'))).toBe(false);
    });
  });
    it('should execute gate and return result with timing', async () => {
      const mockGate = {
        name: 'Test Gate',
        runner: jest.fn().mockResolvedValue({
          passed: true,
          score: 85,
          details: { test: 'result' }
        })
      };

      const result = await qualityGates.executeGate(mockGate);

      expect(result.name).toBe('Test Gate');
      expect(result.passed).toBe(true);
      expect(result.score).toBe(85);
      expect(result.duration).toBeGreaterThan(0);
      expect(mockGate.runner).toHaveBeenCalled();
    });

    it('should handle gate execution errors', async () => {
      const mockGate = {
        name: 'Failing Gate',
        runner: jest.fn().mockRejectedValue(new Error('Gate failed'))
      };

      const result = await qualityGates.executeGate(mockGate);

      expect(result.name).toBe('Failing Gate');
      expect(result.passed).toBe(false);
      expect(result.error).toBe('Gate failed');
    });
  });

  describe('calculateOverallScore', () => {
    it('should calculate weighted average score', () => {
      qualityGates.results.gates = [
        { name: 'Unit Tests', score: 90, passed: true },
        { name: 'Code Coverage', score: 80, passed: true },
        { name: 'Security Scan', score: 95, passed: true }
      ];

      qualityGates.calculateOverallScore();

      expect(qualityGates.results.overall.score).toBeGreaterThan(0);
      expect(qualityGates.results.overall.passed).toBe(true);
    });

    it('should mark overall as failed if any gate fails', () => {
      qualityGates.results.gates = [
        { name: 'Unit Tests', score: 90, passed: true },
        { name: 'Security Scan', score: 0, passed: false }
      ];

      qualityGates.calculateOverallScore();

      expect(qualityGates.results.overall.passed).toBe(false);
    });
  });

  describe('exportResults', () => {
    it('should export results to JSON file', () => {
      fs.writeFileSync.mockImplementation(() => {});
      
      qualityGates.exportResults('custom-results.json');

      expect(fs.writeFileSync).toHaveBeenCalledWith(
        'custom-results.json',
        expect.stringContaining('"timestamp"')
      );
    });
  });
});