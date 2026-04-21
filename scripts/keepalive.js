import { chromium } from 'playwright'

const APPS = [
  { name: 'PPTX Chart Editor', url: 'https://pptx-chart-editor.streamlit.app/' },
]

const WAKE_BUTTON_SELECTORS = [
  'button:has-text("Yes, get this app back up!")',
  'button:has-text("get this app back up")',
  'text=/yes.*back up/i',
]

async function wakeApp(browser, { name, url }) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
  console.log(`[${name}] Visiting ${url}`)
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60_000 })

    let wakeButton = null
    for (const selector of WAKE_BUTTON_SELECTORS) {
      const locator = page.locator(selector).first()
      if ((await locator.count()) > 0) {
        wakeButton = locator
        break
      }
    }

    if (wakeButton) {
      console.log(`[${name}] App was sleeping. Clicking wake button.`)
      await wakeButton.click()
      await page.waitForLoadState('networkidle', { timeout: 120_000 })
      console.log(`[${name}] Wake-up click complete.`)
    } else {
      console.log(`[${name}] Already awake.`)
    }

    await page.waitForTimeout(5_000)
    const title = await page.title()
    console.log(`[${name}] Final title: ${title}`)
  } catch (err) {
    console.error(`[${name}] Error: ${err.message}`)
    process.exitCode = 1
  } finally {
    await page.close()
  }
}

;(async () => {
  const browser = await chromium.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })
  try {
    for (const app of APPS) {
      await wakeApp(browser, app)
    }
  } finally {
    await browser.close()
  }
})()
