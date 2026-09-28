// Verify the deployed bytes, then exercise the actual public player in Chromium.
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { setTimeout: delay } = require('node:timers/promises');
const expected = JSON.parse(fs.readFileSync(path.join(__dirname, '../out/deployment.json'), 'utf8'));
const base = new URL(process.env.SITE_URL);
if (!base.pathname.endsWith('/')) base.pathname += '/';

async function read(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(15000), cache: 'no-store' });
  assert.equal(response.status, 200, `Unexpected HTTP status for ${url}`);
  return response.text();
}

async function verifyPublication() {
  let lastError;
  for (let attempt = 0; attempt < 36; attempt++) {
    try {
      const manifestUrl = new URL('deployment.json', base);
      manifestUrl.searchParams.set('check', `${expected.source_commit}-${Date.now()}`);
      const manifest = JSON.parse(await read(manifestUrl));
      assert.equal(manifest.source_commit, expected.source_commit, 'CDN still serves an older deployment');
      const pageUrl = new URL(base);
      pageUrl.searchParams.set('check', `${expected.source_commit}-${Date.now()}`);
      const html = await read(pageUrl);
      assert.equal(createHash('sha256').update(html).digest('hex'), expected.content_sha256, 'Public HTML does not match the built player');
      for (const id of ['stage', 'bar', 'pp', 'tm', 'snd-btn', 'scene1', 'scene2', 'scene3', 'scene4', 'scene5', 'scene6']) {
        assert.ok(html.includes(`id="${id}"`), `Missing player element: ${id}`);
      }
      console.log(`PASS: HTTP 200, exact player HTML, all six scenes, controls and audio at ${base.href}`);
      console.log(`Verified source commit: ${expected.source_commit}`);
      return;
    } catch (error) {
      lastError = error;
      console.log(`Waiting for Pages (${attempt + 1}/36): ${error.message}`);
      if (attempt < 35) await delay(10000);
    }
  }
  throw lastError;
}

async function verifyBrowser() {
  const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
  const browser = await chromium.launch({ headless: true });
  const output = path.join(__dirname, '../out/verification');
  fs.mkdirSync(output, { recursive: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const url = new URL(base);
    url.searchParams.set('check', expected.source_commit);
    await page.goto(url.href, { waitUntil: 'load' });
    await page.waitForFunction(() => document.querySelector('#stage svg')?.getCurrentTime() > 0.1 && !!window.__catDayMusic);
    assert.equal(await page.locator('#bar .ch').count(), 6);
    assert.equal(await page.evaluate(() => window.__catDayMusic.isPlaying()), false);
    await page.locator('#pp').click();
    assert.equal(await page.evaluate(() => document.querySelector('#stage svg').animationsPaused()), true);
    const pausedAt = await page.evaluate(() => document.querySelector('#stage svg').getCurrentTime());
    await page.waitForTimeout(250);
    assert.ok(Math.abs(await page.evaluate(() => document.querySelector('#stage svg').getCurrentTime()) - pausedAt) < 0.05);
    for (const [index, time] of [5, 14, 24, 34, 44, 54].entries()) {
      await page.evaluate(t => document.querySelector('#stage svg').setCurrentTime(t), time);
      await page.waitForTimeout(100);
      assert.ok(await page.locator(`#scene${index + 1}`).evaluate(node => +getComputedStyle(node).opacity) > 0.5, `Scene ${index + 1} must be visible`);
      await page.screenshot({ path: path.join(output, `scene-${index + 1}.png`) });
    }
    await page.locator('#bar .ch').nth(2).click();
    const chapterTime = await page.evaluate(() => document.querySelector('#stage svg').getCurrentTime() % 60);
    assert.ok(chapterTime >= 19 && chapterTime < 29, 'Window chapter click did not seek');
    await page.keyboard.press('Space');
    assert.equal(await page.evaluate(() => document.querySelector('#stage svg').animationsPaused()), false);
    const before = await page.evaluate(() => document.querySelector('#stage svg').getCurrentTime());
    await page.waitForTimeout(250);
    assert.ok(await page.evaluate(() => document.querySelector('#stage svg').getCurrentTime()) > before + 0.1);
    await page.locator('#snd-btn').click();
    await page.waitForFunction(() => window.__catDayMusic.isPlaying());
    await page.locator('#snd-btn').click();
    assert.equal(await page.evaluate(() => window.__catDayMusic.isPlaying()), false);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: path.join(output, 'mobile.png'), fullPage: true });
    assert.deepEqual(errors, [], 'Uncaught browser errors');
    console.log('PASS: public Chromium playback, pause/resume, six scenes, chapter seeking, keyboard and sound toggle.');
    fs.writeFileSync(path.join(output, 'result.json'), JSON.stringify({ url: base.href, source_commit: expected.source_commit, status: 'passed', errors }, null, 2));
  } finally {
    await browser.close();
  }
}

(process.argv.includes('--browser') ? verifyBrowser() : verifyPublication()).catch(error => {
  console.error(error);
  process.exitCode = 1;
});
