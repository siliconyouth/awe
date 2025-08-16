import puppeteer, { Browser, Page } from 'puppeteer-core';

/**
 * Browserless Service Configuration
 * Provides headless Chrome functionality for web scraping and automation
 */

interface BrowserlessConfig {
  apiKey?: string;
  url?: string;
  timeout?: number;
}

class BrowserlessService {
  private config: Required<BrowserlessConfig>;
  private browser: Browser | null = null;

  constructor(config: BrowserlessConfig = {}) {
    this.config = {
      apiKey: config.apiKey || process.env.BROWSERLESS_API_KEY || '',
      url: config.url || process.env.BROWSERLESS_URL || 'https://chrome.browserless.io',
      timeout: config.timeout || 30000,
    };
  }

  /**
   * Get WebSocket endpoint for Browserless
   */
  private getWebSocketEndpoint(): string {
    if (!this.config.apiKey) {
      throw new Error('BROWSERLESS_API_KEY is not configured');
    }
    return `wss://chrome.browserless.io?token=${this.config.apiKey}`;
  }

  /**
   * Connect to Browserless browser instance
   */
  async connect(): Promise<Browser> {
    if (this.browser?.connected) {
      return this.browser;
    }

    try {
      this.browser = await puppeteer.connect({
        browserWSEndpoint: this.getWebSocketEndpoint(),
      });
      return this.browser;
    } catch (error) {
      console.error('Failed to connect to Browserless:', error);
      throw new Error('Failed to connect to Browserless service');
    }
  }

  /**
   * Create a new page
   */
  async newPage(): Promise<Page> {
    const browser = await this.connect();
    const page = await browser.newPage();
    await page.setDefaultTimeout(this.config.timeout);
    return page;
  }

  /**
   * Take a screenshot of a URL
   */
  async screenshot(url: string, options: {
    fullPage?: boolean;
    width?: number;
    height?: number;
    quality?: number;
    type?: 'jpeg' | 'png';
  } = {}): Promise<Buffer> {
    const page = await this.newPage();
    
    try {
      // Set viewport if dimensions provided
      if (options.width || options.height) {
        await page.setViewport({
          width: options.width || 1920,
          height: options.height || 1080,
        });
      }

      // Navigate to URL
      await page.goto(url, { 
        waitUntil: 'networkidle2',
        timeout: this.config.timeout,
      });

      // Take screenshot
      const screenshot = await page.screenshot({
        fullPage: options.fullPage ?? false,
        type: options.type || 'png',
        quality: options.type === 'jpeg' ? (options.quality || 80) : undefined,
      });

      return Buffer.from(screenshot as Uint8Array);
    } finally {
      await page.close();
    }
  }

  /**
   * Convert a webpage to PDF
   */
  async pdf(url: string, options: {
    format?: 'Letter' | 'Legal' | 'Tabloid' | 'Ledger' | 'A0' | 'A1' | 'A2' | 'A3' | 'A4' | 'A5' | 'A6';
    landscape?: boolean;
    margin?: {
      top?: string;
      right?: string;
      bottom?: string;
      left?: string;
    };
  } = {}): Promise<Buffer> {
    const page = await this.newPage();
    
    try {
      // Navigate to URL
      await page.goto(url, { 
        waitUntil: 'networkidle2',
        timeout: this.config.timeout,
      });

      // Generate PDF
      const pdf = await page.pdf({
        format: options.format || 'A4',
        landscape: options.landscape || false,
        margin: options.margin || {
          top: '1cm',
          right: '1cm',
          bottom: '1cm',
          left: '1cm',
        },
      });

      return Buffer.from(pdf);
    } finally {
      await page.close();
    }
  }

  /**
   * Execute custom Puppeteer script
   */
  async execute<T>(
    fn: (page: Page) => Promise<T>
  ): Promise<T> {
    const page = await this.newPage();
    
    try {
      return await fn(page);
    } finally {
      await page.close();
    }
  }

  /**
   * Scrape content from a webpage
   */
  async scrape(url: string, options: {
    selector?: string;
    waitForSelector?: string;
    evaluate?: string | ((element: any) => any);
  } = {}): Promise<any> {
    return this.execute(async (page) => {
      // Navigate to URL
      await page.goto(url, { 
        waitUntil: 'networkidle2',
        timeout: this.config.timeout,
      });

      // Wait for selector if specified
      if (options.waitForSelector) {
        await page.waitForSelector(options.waitForSelector, {
          timeout: this.config.timeout,
        });
      }

      // Extract content
      if (options.selector) {
        return await page.$eval(
          options.selector,
          options.evaluate || ((el: any) => el.textContent)
        );
      }

      // Return full page HTML if no selector
      return await page.content();
    });
  }

  /**
   * Fill and submit a form
   */
  async submitForm(url: string, formData: Record<string, string>, options: {
    formSelector?: string;
    submitSelector?: string;
    waitForNavigation?: boolean;
  } = {}): Promise<void> {
    return this.execute(async (page) => {
      // Navigate to URL
      await page.goto(url, { 
        waitUntil: 'networkidle2',
        timeout: this.config.timeout,
      });

      // Fill form fields
      for (const [selector, value] of Object.entries(formData)) {
        await page.type(selector, value);
      }

      // Submit form
      if (options.submitSelector) {
        if (options.waitForNavigation) {
          await Promise.all([
            page.waitForNavigation(),
            page.click(options.submitSelector),
          ]);
        } else {
          await page.click(options.submitSelector);
        }
      } else if (options.formSelector) {
        if (options.waitForNavigation) {
          await Promise.all([
            page.waitForNavigation(),
            page.$eval(options.formSelector, (form: any) => form.submit()),
          ]);
        } else {
          await page.$eval(options.formSelector, (form: any) => form.submit());
        }
      }
    });
  }

  /**
   * Disconnect from Browserless
   */
  async disconnect(): Promise<void> {
    if (this.browser?.connected) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

// Export singleton instance
export const browserless = new BrowserlessService();

// Export class for custom instances
export { BrowserlessService };

// Export types
export type { BrowserlessConfig };