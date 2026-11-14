# The Morning Ledger

A personal, distraction-free daily newspaper in a classic broadsheet layout. No ads, pop-ups, paywalls or trackers. Every morning a free GitHub robot gathers stories from public RSS feeds and republishes your page.

**Sections:** National & International · Editorials & Opinion · FinTech & Tax Technology · Tax News & Policy · Product Management & Business Analysis · Emerging Business Trends (with a Business Word of the Day)
**Also:** a dashboard (article count, reading time, trending keywords, markets), saved articles under your own profile name, a clean reader view, and 30 days of past editions.

## Where do I view it?

| How | Address |
|---|---|
| **On the web (after setup below)** | `https://saurabhsrivastav-in.github.io/morning-edition/` |
| **On your own computer** | `http://localhost:8000` (see "Run locally") |

The web address only exists once you finish steps 1 to 6 below. It is shown in **Settings → Pages** of your repository. Opening `docs/index.html` by double-clicking will not work, because browsers block the page from reading its data files that way.

## Set up (about 15 minutes, no coding)

1. **Create a free account** at <https://github.com>.
2. **New repository:** click **+ → New repository**. Name it `morning-edition`, choose **Public**, leave "Add a README" unticked, and click **Create repository**.
3. **Upload the files:** click **uploading an existing file**, drag in everything from inside the unzipped folder, and click **Commit changes**.
   The `.github` folder is hidden on Mac and Windows. Press **Cmd+Shift+.** on a Mac, or use **View → Show → Hidden items** on Windows. If it still doesn't upload, use **Add file → Create new file**, name it `.github/workflows/daily.yml`, paste in that file's contents, and commit.
4. **Turn on Pages:** **Settings → Pages → Source: GitHub Actions**.
5. **Allow saving:** **Settings → Actions → General → Workflow permissions → Read and write → Save**.
6. **Run the first edition:** open the **Actions** tab (click the enable button if shown), choose **Daily Morning Edition → Run workflow**, and wait 2 to 4 minutes for a green tick.

Then open the address from **Settings → Pages** and bookmark it. From now on it updates itself every morning.

**Prefer Vercel?** After step 6, sign in at <https://vercel.com> with GitHub, choose **Add New → Project**, import the repo, leave the settings as they are (`vercel.json` points it at `docs`), and click **Deploy**.

## Using it

- **Read:** headlines open the original article. Openly licensed sources (marked "min read") open a clean reader view with the full text.
- **Filter:** tap a trending keyword to show only matching stories.
- **Save:** tap **☆ Save**. The first time, it asks for your name, which creates your profile. Open **★ Saved** to search, remove or switch profiles.
- **Back up:** saved articles live only in your browser, so use **Download JSON** (restore it with **Import JSON**) or **Download Markdown** for a notes-app list.
- **Other:** past editions in the date drop-down, text size, day/night theme, and print support.

## Customise

Edit `scripts/feeds.json` on GitHub with the pencil icon. A commit triggers a rebuild.

| To change | Edit |
|---|---|
| Name, tagline, timezone | `edition` |
| Add or remove a source | the feed lines inside a section (every item needs a comma except the last) |
| Number of stories, excerpt length | `limits` |
| Market indicators | `markets` |

**Delivery time:** edit the `cron` line in `.github/workflows/daily.yml` (it uses UTC). `"30 0 * * *"` is 06:00 India, `"0 6 * * *"` is 06:00 UK in winter, and `"0 11 * * *"` is 06:00 US Eastern in winter.

## Run locally

```bash
pip install -r scripts/requirements.txt
python scripts/fetch_news.py            # build today's edition (add --sample for offline demo data)
cd docs && python -m http.server 8000   # open http://localhost:8000
```

Self-checks: `python -m unittest scripts/test_fetcher.py` and `node scripts/test_bookmarks.mjs`.

## Copyright and ethics

- Only public RSS/Atom feeds and open APIs are used. Nothing is scraped, and nothing behind a paywall or login is fetched.
- By default each story shows the headline, a short excerpt (about 45 words, taken from the publisher's own feed) and a link back, with the source named.
- Full text appears only for feeds marked `"full_text": true`, which are Global Voices (CC BY 3.0) and Wikinews (CC BY 2.5). It carries a licence link, and images and ads are removed. Add this flag only for content whose licence permits it.
- Requests are polite: a clear User-Agent, one request per feed per day, and short pauses.
- Markets data comes from Stooq, the ECB via Frankfurter, and CoinGecko. It is informational only, not investment advice.
- No analytics or accounts. A public Pages site can be opened by anyone with the link, so remove any publisher you're unsure about, or run the site locally only.

## Troubleshooting

| Problem | Fix |
|---|---|
| "SAMPLE edition" banner | Run the workflow (step 6) and refresh. |
| "Could not load the edition" | Use the web address or the local server, not the file itself. |
| Run fails at "Fetch today's edition" | Every feed failed. Re-run, then check the log lines starting with `!`. |
| Run fails at "Save the new edition" | Do step 5. |
| A feed never shows stories | Its address changed. Fix or remove it in `feeds.json` (broken feeds are listed at the bottom of the page). |

## Good to know

Feed addresses were not live-tested when this was built, so check your first run's log. Excerpts are extracted sentences, not AI summaries. Free tax-technology feeds are scarce, so that section leans on general fintech news. Index changes are measured from the day's open.

## Files

`docs/` is the website (`index.html`, `assets/`, `data/`). `scripts/` holds the fetcher, `feeds.json`, the 40 vocabulary terms and the tests. `.github/workflows/daily.yml` is the daily robot.

Code: MIT licence. News content belongs to its publishers.
