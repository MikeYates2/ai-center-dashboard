# ai-center-dashboard

Hosts the AI Center Programming Dashboard on Netlify.

- `index.html` is the whole dashboard: one self-contained page with its data built in. There is no passcode.
- Copilot rebuilds it every morning at 10:00 AM CT from the AI Programming Dashboard- FY27 workbook, the AI Center Loop pages, the AI Center Mixtape and the AI Center SharePoint site pages.
- Netlify redeploys automatically whenever `index.html` changes on the `main` branch. No build command is needed.
- `netlify.toml` turns off caching, so visitors always get the latest version, and asks search engines not to index the site.
