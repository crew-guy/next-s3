// We will first take a screenshot of the website
// For this we will be using a headless browser like puppeteer
// Puppeteer's main binary crashes weirdly on aws lambda so we use aws lambda instead
const chromium = require('chrome-aws-lambda');

const getBrowserInstance = async () => {
    const executablePath = await chromium.executablePath;
    if (!executablePath) {
        const puppeteer = require('puppeteer')
        return puppeteer.launch({
            args: chromium.args,
            headless: true,
            ignoreHTTPSErrors: true,
        })
    }
    
    return chromium.puppeteer.launch({
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath,
        headless: chromium.headless,
        ignoreHTTPSErrors: true,
      });
}


export default async (req, res) => {
    const url = req.body.url
    console.log(req)
    if (!url || !url.trim()) {
        res.json({
            status: 'error',
            error: 'Enter a valid.URL'
        })
        return
    }


  let result = null;
  let browser = null;

  try {
    browser = await getBrowserInstance()

    let page = await browser.newPage();

    await page.goto(url);

    // If no path is specified, this gets saved by default in memory
      const imageBuffer = await page.screenshot()
      

    // Upload this buffer on aws s3
  } catch (error) {
      console.log(error)
    // return callback(error);
  } finally {
    if (browser !== null) {
      await browser.close();
    }
  }

//   return callback(null, result);

  
    res.json({
        status: 'ok',
        data : result
    })

};