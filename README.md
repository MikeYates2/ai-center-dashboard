# ai-center-dashboard

Hosts the AI Center Programming Dashboard on Netlify (https://aicenterdash.netlify.app/).

- `index.html` is the dashboard: one self-contained page with its data built in.
- `data.json` holds the day's events, steering metrics, course completion and Menu of Offerings. Copilot pushes it here every morning after the 10:00 AM CT refresh, using the GitHub connector. When the hosted page loads, it uses `data.json` if it is newer than the data built into `index.html`.
- `netlify/edge-functions/passcode.js` puts a passcode screen in front of the whole site (the page and `data.json`). It runs on Netlify before every request, stores only hashes of the passcode, and keeps visitors signed in for 30 days. Visit `/logout` to sign out. To remove the passcode, delete this file.
- The knowledge base behind the chatbot (release notes, Mixtape, AI Center site pages) lives inside `index.html`. Replace `index.html` with the latest copy from OneDrive when that content needs refreshing.
- Netlify redeploys automatically whenever a file changes on the `main` branch. No build command is needed.
- `netlify.toml` turns off caching, so visitors always get the latest version, and asks search engines not to index the site.
