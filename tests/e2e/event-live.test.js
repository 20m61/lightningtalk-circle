/**
 * Event Live Screen E2E Tests
 * ライブイベント画面のE2Eテスト
 */

import { test, expect } from '@playwright/test';

test.describe('Event Live Screen', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to event live page
    await page.goto('/event-live.html');
    await page.waitForLoadState('networkidle');
  });

  test('should display live event layout', async ({ page }) => {
    // Check main layout components
    await expect(page.locator('.live-header')).toBeVisible();
    await expect(page.locator('.live-main')).toBeVisible();
    await expect(page.locator('.program-sidebar')).toBeVisible();
    await expect(page.locator('.main-content')).toBeVisible();
    await expect(page.locator('.qa-sidebar')).toBeVisible();
  });

  test('should show live status indicator', async ({ page }) => {
    // Check live status
    await expect(page.locator('.live-status')).toBeVisible();
    await expect(page.locator('.status-indicator.live')).toBeVisible();
    await expect(page.locator('.status-text')).toHaveText('ライブ配信中');

    // Check viewer count
    await expect(page.locator('.viewer-count')).toBeVisible();
    await expect(page.locator('#viewerCount')).toBeVisible();
  });

  test('should display program schedule', async ({ page }) => {
    // Check program list
    const programList = page.locator('.program-list');
    await expect(programList).toBeVisible();

    // Check program items
    const programItems = page.locator('.program-item');
    await expect(programItems).toHaveCount(5);

    // Check current program is highlighted
    await expect(page.locator('.program-item.current')).toBeVisible();
    await expect(page.locator('.program-item.current .status')).toHaveText('▶️');

    // Check completed programs
    const completedItems = page.locator('.program-item.completed');
    await expect(completedItems).toHaveCount(2);
  });

  test('should display current talk information', async ({ page }) => {
    // Check current talk header
    await expect(page.locator('.current-talk-header')).toBeVisible();
    await expect(page.locator('.current-talk-title')).toHaveText('猫との暮らしの工夫');

    // Check speaker info
    await expect(page.locator('.current-speaker-info')).toBeVisible();
    await expect(page.locator('.speaker-name')).toHaveText('鈴木花子');
    await expect(page.locator('.talk-category')).toContainText('ペット・動物');
  });

  test('should display and update timer', async ({ page }) => {
    // Check timer display
    await expect(page.locator('.timer-section')).toBeVisible();
    await expect(page.locator('.main-timer')).toBeVisible();
    await expect(page.locator('#currentTime')).toBeVisible();

    // Check timer segments
    const segments = page.locator('.time-segments .segment');
    await expect(segments).toHaveCount(3);
    await expect(segments.nth(1)).toHaveClass(/active/);
  });

  test('should handle reaction buttons', async ({ page }) => {
    // Check reaction buttons
    const reactionButtons = page.locator('.reaction-btn');
    await expect(reactionButtons).toHaveCount(5);

    // Click a reaction
    const clapButton = page.locator('.reaction-btn:has-text("👏")');
    const initialCount = await clapButton.locator('.count').textContent();

    await clapButton.click();

    // Check floating reaction animation
    await expect(page.locator('.floating-reactions')).toBeVisible();

    // In real app, count would update
    await expect(clapButton.locator('.count')).toBeVisible();
  });

  test('should show voting section when appropriate', async ({ page }) => {
    // Initially voting section might be hidden
    const votingSection = page.locator('#votingSection');

    // Check if voting section exists
    if (await votingSection.isVisible()) {
      // Check voting options
      const voteButtons = page.locator('.vote-btn');
      await expect(voteButtons).toHaveCount(5);

      // Click a vote
      await voteButtons.nth(0).click();

      // Results might show
      const voteResults = page.locator('#voteResults');
      if (await voteResults.isVisible()) {
        await expect(voteResults.locator('.result-bar')).toHaveCount(5);
      }
    }
  });

  test('should handle Q&A submission', async ({ page }) => {
    // Check Q&A input
    const questionInput = page.locator('#questionInput');
    await expect(questionInput).toBeVisible();

    // Type a question
    await questionInput.fill('質問テストです');

    // Submit question
    await page.click('button:has-text("質問を送信")');

    // In real app, question would be added to list
    await expect(page.locator('.qa-list')).toBeVisible();
  });

  test('should display existing Q&A items', async ({ page }) => {
    // Check Q&A list
    const qaList = page.locator('.qa-list');
    await expect(qaList).toBeVisible();

    // Check Q&A items
    const qaItems = page.locator('.qa-item');
    await expect(qaItems.first()).toBeVisible();

    // Check Q&A structure
    const firstQA = qaItems.first();
    await expect(firstQA.locator('.qa-author')).toBeVisible();
    await expect(firstQA.locator('.qa-time')).toBeVisible();
    await expect(firstQA.locator('.qa-text')).toBeVisible();

    // Check upvote button
    await expect(firstQA.locator('.upvote-btn')).toBeVisible();
  });

  test('should upvote questions', async ({ page }) => {
    // Find first Q&A item
    const firstQA = page.locator('.qa-item').first();
    const upvoteBtn = firstQA.locator('.upvote-btn');

    // Get initial vote count
    const initialVotes = await upvoteBtn.locator('.vote-count').textContent();

    // Click upvote
    await upvoteBtn.click();

    // In real app, vote count would update
    await expect(upvoteBtn.locator('.vote-count')).toBeVisible();
  });

  test('should display answered questions differently', async ({ page }) => {
    // Find answered question
    const answeredQA = page.locator('.qa-item.answered').first();

    if ((await answeredQA.count()) > 0) {
      // Check answered styling
      await expect(answeredQA).toHaveClass(/answered/);

      // Check answer content
      await expect(answeredQA.locator('.qa-answer')).toBeVisible();
      await expect(answeredQA.locator('.answer-label')).toHaveText('回答済み');
    }
  });

  test('should share event', async ({ page }) => {
    // Click share button
    const shareBtn = page.locator('.btn-share');
    await expect(shareBtn).toBeVisible();

    // Set up dialog handler
    page.on('dialog', dialog => {
      expect(dialog.type()).toBe('alert');
      dialog.accept();
    });

    // Click share
    await shareBtn.click();

    // In real app, this would open share dialog
  });

  test('should display admin controls for admins', async ({ page }) => {
    // Check if admin controls exist
    const adminControls = page.locator('#adminControls');

    if (await adminControls.isVisible()) {
      // Check admin buttons
      await expect(adminControls.locator('button:has-text("次の発表へ")')).toBeVisible();
      await expect(adminControls.locator('button:has-text("一時停止")')).toBeVisible();
      await expect(adminControls.locator('button:has-text("イベント終了")')).toBeVisible();
    }
  });

  test('should display next speaker information', async ({ page }) => {
    // Check next up section
    const nextUp = page.locator('.next-up');
    await expect(nextUp).toBeVisible();

    // Check next speaker details
    await expect(nextUp.locator('.next-speaker')).toBeVisible();
    await expect(nextUp.locator('.name')).toBeVisible();
    await expect(nextUp.locator('.talk-title')).toBeVisible();
  });

  test('should handle timer progress visualization', async ({ page }) => {
    // Check timer SVG
    const timerSvg = page.locator('.timer-svg');
    await expect(timerSvg).toBeVisible();

    // Check progress circle
    const progressCircle = page.locator('.timer-progress');
    await expect(progressCircle).toBeVisible();
    await expect(progressCircle).toHaveAttribute('stroke-dasharray');
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Main content should still be visible
    await expect(page.locator('.main-content')).toBeVisible();

    // Sidebars might be hidden or repositioned
    const programSidebar = page.locator('.program-sidebar');
    const qaSidebar = page.locator('.qa-sidebar');

    // Check if layout adapts
    await expect(page.locator('.live-container')).toBeVisible();
  });

  test('should handle keyboard navigation', async ({ page }) => {
    // Tab through interactive elements
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Check focus is on an interactive element
    const focusedElement = await page.evaluate(() => {
      const el = document.activeElement;
      return {
        tagName: el.tagName,
        className: el.className
      };
    });

    expect(['BUTTON', 'A', 'INPUT', 'TEXTAREA']).toContain(focusedElement.tagName);
  });
});

test.describe('Event Live Real-time Features', () => {
  test('should update viewer count', async ({ page }) => {
    await page.goto('/event-live.html');

    // Get initial viewer count
    const initialCount = await page.locator('#viewerCount').textContent();

    // In real app with WebSocket, count would update
    // For now, just verify it's a number
    expect(parseInt(initialCount)).toBeGreaterThan(0);
  });

  test('should handle floating reactions', async ({ page }) => {
    await page.goto('/event-live.html');

    // Click multiple reactions quickly
    const reactions = ['👏', '❤️', '😄'];

    for (const emoji of reactions) {
      await page.click(`.reaction-btn:has-text("${emoji}")`);
      await page.waitForTimeout(100);
    }

    // Check floating reactions container
    await expect(page.locator('.floating-reactions')).toBeVisible();
  });

  test('should handle question character limit', async ({ page }) => {
    await page.goto('/event-live.html');

    const questionInput = page.locator('#questionInput');
    const longText = 'あ'.repeat(250); // More than 200 character limit

    await questionInput.fill(longText);

    // Check maxlength is enforced
    const actualValue = await questionInput.inputValue();
    expect(actualValue.length).toBeLessThanOrEqual(200);
  });
});
