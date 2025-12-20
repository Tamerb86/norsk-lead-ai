import { Router, Request, Response } from "express";
import { logEmailEvent } from "./emailTracking";

const router = Router();

/**
 * Tracking pixel endpoint - logs email opens
 * GET /track/open/:trackingId
 */
router.get("/open/:trackingId", async (req: Request, res: Response) => {
  const { trackingId } = req.params;
  
  try {
    // Log the open event
    await logEmailEvent({
      trackingId,
      eventType: "open",
      userAgent: req.headers["user-agent"],
      ipAddress: req.ip || req.connection.remoteAddress,
    });
  } catch (error) {
    console.error("[Tracking] Failed to log open event:", error);
    // Don't fail the request even if logging fails
  }
  
  // Return a 1x1 transparent GIF
  const pixel = Buffer.from(
    "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
    "base64"
  );
  
  res.writeHead(200, {
    "Content-Type": "image/gif",
    "Content-Length": pixel.length,
    "Cache-Control": "no-store, no-cache, must-revalidate, private",
    "Pragma": "no-cache",
    "Expires": "0",
  });
  
  res.end(pixel);
});

/**
 * Link click tracking endpoint - logs clicks and redirects
 * GET /track/click/:trackingId/:encodedUrl
 */
router.get("/click/:trackingId/:encodedUrl", async (req: Request, res: Response) => {
  const { trackingId, encodedUrl } = req.params;
  
  try {
    // Decode the original URL
    const originalUrl = decodeURIComponent(encodedUrl);
    
    // Log the click event
    await logEmailEvent({
      trackingId,
      eventType: "click",
      linkUrl: originalUrl,
      userAgent: req.headers["user-agent"],
      ipAddress: req.ip || req.connection.remoteAddress,
    });
    
    // Redirect to the original URL
    res.redirect(302, originalUrl);
  } catch (error) {
    console.error("[Tracking] Failed to log click event:", error);
    
    // Try to redirect anyway
    try {
      const originalUrl = decodeURIComponent(encodedUrl);
      res.redirect(302, originalUrl);
    } catch {
      res.status(400).send("Invalid URL");
    }
  }
});

/**
 * Unsubscribe endpoint - renders unsubscribe page
 * GET /unsubscribe/:trackingId
 */
router.get("/unsubscribe/:trackingId", async (req: Request, res: Response) => {
  const { trackingId } = req.params;
  
  // Render a simple unsubscribe confirmation page
  res.send(`
    <!DOCTYPE html>
    <html lang="no">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Avmelding - NorskLeads</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        
        .container {
          background: white;
          border-radius: 16px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          max-width: 500px;
          width: 100%;
          padding: 40px;
          text-align: center;
        }
        
        h1 {
          color: #1a202c;
          font-size: 28px;
          margin-bottom: 16px;
        }
        
        p {
          color: #4a5568;
          font-size: 16px;
          line-height: 1.6;
          margin-bottom: 24px;
        }
        
        .button {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          padding: 14px 32px;
          font-size: 16px;
          font-weight: 600;
          border-radius: 8px;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
          text-decoration: none;
          display: inline-block;
        }
        
        .button:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(102, 126, 234, 0.4);
        }
        
        .button:active {
          transform: translateY(0);
        }
        
        .success {
          display: none;
          color: #38a169;
          font-weight: 600;
          margin-top: 20px;
        }
        
        .icon {
          font-size: 48px;
          margin-bottom: 20px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="icon">✉️</div>
        <h1>Bekreft avmelding</h1>
        <p>
          Er du sikker på at du vil melde deg av våre e-postutsendelser?
          Du vil ikke lenger motta oppdateringer eller tilbud fra oss.
        </p>
        <button class="button" onclick="unsubscribe()">
          Ja, meld meg av
        </button>
        <p class="success" id="success">
          ✅ Du er nå avmeldt. Takk!
        </p>
      </div>
      
      <script>
        async function unsubscribe() {
          try {
            const response = await fetch('/track/unsubscribe/${trackingId}', {
              method: 'POST'
            });
            
            if (response.ok) {
              document.querySelector('.button').style.display = 'none';
              document.querySelector('p:not(.success)').style.display = 'none';
              document.getElementById('success').style.display = 'block';
              document.querySelector('h1').textContent = 'Avmeldt!';
              document.querySelector('.icon').textContent = '✅';
            } else {
              alert('Noe gikk galt. Vennligst prøv igjen.');
            }
          } catch (error) {
            console.error('Unsubscribe error:', error);
            alert('Noe gikk galt. Vennligst prøv igjen.');
          }
        }
      </script>
    </body>
    </html>
  `);
});

/**
 * Unsubscribe confirmation endpoint - processes the unsubscribe
 * POST /unsubscribe/:trackingId
 */
router.post("/unsubscribe/:trackingId", async (req: Request, res: Response) => {
  const { trackingId } = req.params;
  
  try {
    // Log the unsubscribe event
    await logEmailEvent({
      trackingId,
      eventType: "unsubscribe",
      userAgent: req.headers["user-agent"],
      ipAddress: req.ip || req.connection.remoteAddress,
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error("[Tracking] Failed to log unsubscribe event:", error);
    res.status(500).json({ success: false, error: "Failed to unsubscribe" });
  }
});

export default router;
