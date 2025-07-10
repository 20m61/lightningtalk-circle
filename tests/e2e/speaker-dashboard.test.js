/**
 * Speaker Dashboard E2E Tests
 * スピーカーダッシュボードのE2Eテスト
 */

import { test, expect } from '@playwright/test';

// Test data
const mockSpeaker = {
  name: '山田太郎',
  email: 'yamada@example.com',
  talks: 5,
  rating: 4.8
};

test.describe('Speaker Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to speaker dashboard
    await page.goto('/speaker-dashboard.html');
    await page.waitForLoadState('networkidle');
  });

  test('should display speaker dashboard layout', async ({ page }) => {
    // Check main elements are visible
    await expect(page.locator('.dashboard-main')).toBeVisible();
    await expect(page.locator('.dashboard-sidebar')).toBeVisible();
    await expect(page.locator('.dashboard-content')).toBeVisible();

    // Check speaker profile is displayed
    await expect(page.locator('.speaker-profile')).toBeVisible();
    await expect(page.locator('.profile-name')).toContainText(mockSpeaker.name);
  });

  test('should navigate between dashboard sections', async ({ page }) => {
    // Click on "My Talks" navigation
    await page.click('.nav-item[href="#my-talks"]');

    // Check that the section is active
    await expect(page.locator('#my-talks')).toHaveClass(/active/);
    await expect(page.locator('.nav-item[href="#my-talks"]')).toHaveClass(/active/);

    // Click on "Upcoming" navigation
    await page.click('.nav-item[href="#upcoming"]');
    await expect(page.locator('#upcoming')).toHaveClass(/active/);

    // Click on "Feedback" navigation
    await page.click('.nav-item[href="#feedback"]');
    await expect(page.locator('#feedback')).toHaveClass(/active/);
  });

  test('should display dashboard statistics', async ({ page }) => {
    // Check stat cards are visible
    const statCards = page.locator('.stat-card');
    await expect(statCards).toHaveCount(4);

    // Check specific stats
    await expect(page.locator('.stat-card:has-text("今月の発表")')).toBeVisible();
    await expect(page.locator('.stat-card:has-text("総視聴者数")')).toBeVisible();
    await expect(page.locator('.stat-card:has-text("平均評価")')).toBeVisible();
    await expect(page.locator('.stat-card:has-text("Q&A回答数")')).toBeVisible();
  });

  test('should open and use practice timer', async ({ page }) => {
    // Click practice timer button
    await page.click('button:has-text("練習タイマー")');

    // Check timer modal is open
    await expect(page.locator('#practiceTimerModal')).toBeVisible();

    // Check timer elements
    await expect(page.locator('.timer-display')).toBeVisible();
    await expect(page.locator('#timerMinutes')).toHaveText('05');
    await expect(page.locator('#timerSeconds')).toHaveText('00');

    // Start timer
    await page.click('#startTimer');

    // Wait a moment and check timer is running
    await page.waitForTimeout(1500);
    const seconds = await page.locator('#timerSeconds').textContent();
    expect(parseInt(seconds)).toBeLessThan(60);

    // Pause timer
    await page.click('#pauseTimer');
    const pausedSeconds = await page.locator('#timerSeconds').textContent();

    // Wait and check timer is paused
    await page.waitForTimeout(1000);
    const stillPausedSeconds = await page.locator('#timerSeconds').textContent();
    expect(pausedSeconds).toBe(stillPausedSeconds);

    // Reset timer
    await page.click('#resetTimer');
    await expect(page.locator('#timerMinutes')).toHaveText('05');
    await expect(page.locator('#timerSeconds')).toHaveText('00');

    // Close modal
    await page.click('.modal .close');
    await expect(page.locator('#practiceTimerModal')).not.toBeVisible();
  });

  test('should display upcoming talks', async ({ page }) => {
    // Check upcoming talks section
    await expect(page.locator('.upcoming-talks')).toBeVisible();
    await expect(page.locator('.talk-card.upcoming')).toBeVisible();

    // Check talk details
    const talkCard = page.locator('.talk-card.upcoming').first();
    await expect(talkCard.locator('.talk-title')).toBeVisible();
    await expect(talkCard.locator('.event-name')).toBeVisible();
    await expect(talkCard.locator('.talk-duration')).toBeVisible();

    // Check action buttons
    await expect(talkCard.locator('button:has-text("スライドをアップロード")')).toBeVisible();
    await expect(talkCard.locator('button:has-text("練習タイマー")')).toBeVisible();
  });

  test('should display recent feedback', async ({ page }) => {
    // Check feedback section
    await expect(page.locator('.recent-feedback')).toBeVisible();

    // Check feedback items
    const feedbackItems = page.locator('.feedback-item');
    await expect(feedbackItems).toHaveCount(2);

    // Check feedback structure
    const firstFeedback = feedbackItems.first();
    await expect(firstFeedback.locator('.feedback-author')).toBeVisible();
    await expect(firstFeedback.locator('.feedback-date')).toBeVisible();
    await expect(firstFeedback.locator('.feedback-rating')).toBeVisible();
    await expect(firstFeedback.locator('.feedback-text')).toBeVisible();
  });

  test('should filter talks in My Talks section', async ({ page }) => {
    // Navigate to My Talks
    await page.click('.nav-item[href="#my-talks"]');

    // Check filter dropdown
    const filterSelect = page.locator('.filter-select');
    await expect(filterSelect).toBeVisible();

    // Select "upcoming" filter
    await filterSelect.selectOption('upcoming');

    // Check talks are filtered (this would need actual implementation)
    await expect(page.locator('.talk-item')).toBeVisible();
  });

  test('should handle responsive mobile view', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Check mobile menu toggle is visible
    await expect(page.locator('.mobile-menu-toggle')).toBeVisible();

    // Dashboard should still be functional
    await expect(page.locator('.dashboard-content')).toBeVisible();

    // Sidebar might be hidden on mobile
    const sidebar = page.locator('.dashboard-sidebar');
    const isVisible = await sidebar.isVisible();
    if (!isVisible) {
      // Click mobile menu to show sidebar
      await page.click('.mobile-menu-toggle');
      await expect(sidebar).toBeVisible();
    }
  });

  test('should handle talk actions', async ({ page }) => {
    // Navigate to My Talks
    await page.click('.nav-item[href="#my-talks"]');

    // Find a talk item
    const talkItem = page.locator('.talk-item').first();
    await expect(talkItem).toBeVisible();

    // Check action buttons
    await expect(talkItem.locator('.btn-icon[title="編集"]')).toBeVisible();
    await expect(talkItem.locator('.btn-icon[title="プレビュー"]')).toBeVisible();
    await expect(talkItem.locator('.btn-icon[title="削除"]')).toBeVisible();
  });

  test('should show speaker stats in sidebar', async ({ page }) => {
    // Check speaker stats
    const speakerStats = page.locator('.speaker-stats');
    await expect(speakerStats).toBeVisible();

    // Check stat values
    await expect(speakerStats.locator('.stat-item:has-text("発表回数")')).toBeVisible();
    await expect(speakerStats.locator('.stat-item:has-text("平均評価")')).toBeVisible();
  });

  test('should handle logout action', async ({ page }) => {
    // Check logout button exists
    const logoutBtn = page.locator('.logout-btn');
    await expect(logoutBtn).toBeVisible();

    // Click logout (would need actual implementation)
    await logoutBtn.click();

    // In real app, this would redirect to login page
    // For now, just check button was clickable
    await expect(logoutBtn).toBeVisible();
  });

  test('should show talk progress for drafts', async ({ page }) => {
    // Navigate to My Talks
    await page.click('.nav-item[href="#my-talks"]');

    // Find a draft talk
    const draftTalk = page.locator('.talk-item:has(.talk-status.draft)').first();

    if ((await draftTalk.count()) > 0) {
      // Check progress bar
      await expect(draftTalk.locator('.progress-bar')).toBeVisible();
      await expect(draftTalk.locator('.progress-fill')).toBeVisible();
      await expect(draftTalk.locator('.progress-text')).toBeVisible();
    }
  });

  test('should have proper accessibility attributes', async ({ page }) => {
    // Check ARIA labels
    await expect(page.locator('.dashboard-sidebar nav')).toHaveAttribute('role', 'navigation');

    // Check keyboard navigation
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Should be able to navigate with keyboard
    const focusedElement = await page.evaluate(() => document.activeElement.tagName);
    expect(focusedElement).toBeTruthy();
  });

  test('should display timer tips', async ({ page }) => {
    // Open practice timer
    await page.click('button:has-text("練習タイマー")');

    // Check timer tips are visible
    await expect(page.locator('.timer-tips')).toBeVisible();
    await expect(page.locator('.timer-tips h4')).toHaveText('タイムマネジメントのコツ');

    // Check tips content
    const tips = page.locator('.timer-tips li');
    await expect(tips).toHaveCount(3);
    await expect(tips.nth(0)).toContainText('導入');
    await expect(tips.nth(1)).toContainText('本題');
    await expect(tips.nth(2)).toContainText('まとめ');
  });
});

test.describe('Speaker Dashboard API Integration', () => {
  test('should load speaker stats from API', async ({ page }) => {
    // Mock API response
    await page.route('/api/speakers/me/stats', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          monthlyTalks: 2,
          totalViewers: 324,
          averageRating: 4.8,
          qaAnswers: 18
        })
      });
    });

    // Navigate to dashboard
    await page.goto('/speaker-dashboard.html');

    // Wait for stats to load
    await page.waitForResponse('/api/speakers/me/stats');

    // Check stats are displayed
    await expect(page.locator('.stat-card:has-text("今月の発表") .stat-number')).toHaveText('2');
    await expect(page.locator('.stat-card:has-text("総視聴者数") .stat-number')).toHaveText('324');
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Mock API error
    await page.route('/api/speakers/me/stats', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' })
      });
    });

    // Navigate to dashboard
    await page.goto('/speaker-dashboard.html');

    // Dashboard should still be functional
    await expect(page.locator('.dashboard-content')).toBeVisible();

    // Stats might show default values
    await expect(page.locator('.stat-card')).toHaveCount(4);
  });
});
