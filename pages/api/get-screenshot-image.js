// We will first take a screenshot of the website
// For this we will be using a headless browser like puppeteer
// Puppeteer's main binary crashes weirdly on aws lambda so we use aws lambda instead
import AWS from 'aws-sdk'

const S3 = new AWS.S3({
    credentials: {
        accessKeyId: "....",
        secretAccessKey: "...."
    }
})


const getBrowserInstance = async () => {
    const chromium = require('chrome-aws-lambda');
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
      
      const params = {
          Bucket = 'MY_TEST_BUCKET',
          Key: 'uploaded on' + Date.now() + 'jpg',
          Body:imageBuffer
      }
      
      S3.upload(params, (error, data) => {
          if (error) {
              return res.json({
                  status: 'error',
                  error:error.message || 'Something went wrong'
              })
          }
          const fileName = 'uploaded on' + Date.now() + 'jpg'

          const params = {
              Bucket: "MY_TEST_BUCKET",
              Key: fileName,
              Expires: 60
          }

          const signedURL = S3.getSignedUrl('getObject', params)
          
            res.json({
                status: 'ok',
                data: signedURL
            })
      })

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

};