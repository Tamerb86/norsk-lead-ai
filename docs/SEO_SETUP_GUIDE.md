# NorskLeads SEO Setup Guide

## 📊 Google Analytics 4 (GA4) Setup

### Step 1: Create GA4 Property
1. Go to [Google Analytics](https://analytics.google.com)
2. Click "Admin" → "Create Property"
3. Enter property name: "NorskLeads"
4. Select timezone: "(GMT+01:00) Oslo"
5. Select currency: "Norwegian Krone (NOK)"

### Step 2: Get Measurement ID
1. In GA4, go to Admin → Data Streams
2. Click "Add stream" → "Web"
3. Enter URL: `https://lead.nexifyhub.no`
4. Stream name: "NorskLeads Web"
5. Copy the Measurement ID (format: G-XXXXXXXXXX)

### Step 3: Configure in Application
Add to Railway environment variables:
\`\`\`
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
\`\`\`

Or update directly in `client/index.html`:
\`\`\`html
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
\`\`\`

---

## 🔍 Google Search Console Setup

### Step 1: Add Property
1. Go to [Google Search Console](https://search.google.com/search-console)
2. Click "Add property"
3. Choose "URL prefix" method
4. Enter: `https://lead.nexifyhub.no`

### Step 2: Verify Ownership
**Option A: HTML Tag (Recommended)**
1. Copy the meta tag provided
2. Add to `client/index.html` in the `<head>` section:
\`\`\`html
<meta name="google-site-verification" content="YOUR_VERIFICATION_CODE" />
\`\`\`

**Option B: DNS Record**
1. Add TXT record to your DNS:
   - Type: TXT
   - Name: @
   - Value: google-site-verification=YOUR_CODE

### Step 3: Submit Sitemap
1. In Search Console, go to "Sitemaps"
2. Enter: `sitemap.xml`
3. Click "Submit"

### Step 4: Request Indexing
1. Go to "URL Inspection"
2. Enter your homepage URL
3. Click "Request Indexing"
4. Repeat for key pages:
   - /features
   - /pricing
   - /blog
   - /bedrifter/oslo
   - /bransjer/bygg-og-anlegg

---

## 📈 Recommended GA4 Events to Track

### Conversion Events (Mark as conversions in GA4)
- `sign_up` - User registration
- `purchase` - Subscription purchase
- `contact_form_submit` - Contact form submission

### Engagement Events
- `search` - Company search
- `view_item` - View company details
- `add_to_wishlist` - Save company
- `export_leads` - Export leads
- `send_campaign` - Send email campaign

### Setup in GA4:
1. Go to Admin → Events
2. Click "Create event" for custom events
3. Mark conversion events: Admin → Conversions → New conversion event

---

## 🎯 SEO Checklist

### Technical SEO ✅
- [x] sitemap.xml created
- [x] robots.txt configured
- [x] Structured data (JSON-LD) added
- [x] Canonical URLs implemented
- [x] Mobile-friendly design
- [x] Fast loading (Vite optimization)

### On-Page SEO ✅
- [x] Unique title tags per page
- [x] Meta descriptions optimized
- [x] H1-H6 hierarchy correct
- [x] Image alt text (where applicable)
- [x] Internal linking structure

### Local SEO ✅
- [x] City landing pages (Oslo, Bergen, etc.)
- [x] Industry landing pages
- [x] LocalBusiness schema markup
- [x] Norwegian language content

### Content SEO ✅
- [x] Blog section created
- [x] User guide created
- [x] FAQ structured data
- [x] Norwegian keywords optimized

---

## 🔧 Environment Variables

Add these to Railway:

\`\`\`env
# Google Analytics
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# Enable analytics in development (optional)
VITE_ENABLE_ANALYTICS=false
\`\`\`

---

## 📱 Social Media Verification

### Facebook
1. Go to Facebook Business Settings
2. Add domain: lead.nexifyhub.no
3. Verify via meta tag or DNS

### LinkedIn
1. Go to LinkedIn Marketing Solutions
2. Add your company page
3. Verify website ownership

### Twitter
1. Set up Twitter Cards validator
2. Test at: https://cards-dev.twitter.com/validator

---

## 🚀 Post-Launch SEO Tasks

### Week 1
- [ ] Submit sitemap to Google Search Console
- [ ] Submit sitemap to Bing Webmaster Tools
- [ ] Verify all pages are indexed
- [ ] Check for crawl errors

### Month 1
- [ ] Monitor Search Console for issues
- [ ] Check Core Web Vitals
- [ ] Review keyword rankings
- [ ] Analyze traffic sources

### Ongoing
- [ ] Publish blog content regularly
- [ ] Update sitemap when adding pages
- [ ] Monitor and fix broken links
- [ ] Optimize based on analytics data

---

## 📞 Support

For SEO questions or issues, contact:
- Technical: dev@nexifyhub.no
- Marketing: marketing@nexifyhub.no
