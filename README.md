# The Morning Ledger

A personal, distraction-free **daily morning digital newspaper**. It looks and reads like a classic broadsheet (serif type, ruled columns, a front page), but it is an original design with its own name. No ads, no pop-ups, no subscription prompts, no tracking, no accounts.

Every morning a free GitHub robot gathers stories from public RSS feeds, writes them into a small data file, and republishes your website. You open one page and read.

**What's inside the paper**

| Section | What you'll find |
|---|---|
| National & International News | Front page lead plus world and India headlines |
| Editorials & Opinion | Newspaper editorials and commentary |
| FinTech & Tax Technology | Payments, banking tech, tax-tech and regtech news |
| Tax News & Policy Updates | Tax authority notices, tax policy research, Indian tax news |
| Product Management & Business Analysis | Craft articles from respected practitioners |
| Emerging Business Trends & Vocabulary | Trend stories plus a **Business Word of the Day** (and a dictionary word) |

**Plus:** a *Today at a glance* dashboard (articles curated, reading time, trending keywords, market indicators), **saved articles under your own profile name**, a distraction-free reader view, past editions (30 days), day/night themes, text size controls, and print-friendly output.

---

## Folder structure

```
morning-edition/
├── README.md                    ← you are here
├── LICENSE                      ← MIT licence for the code
├── vercel.json                  ← only used if you deploy on Vercel
├── .gitignore
├── .github/
│   └── workflows/
│       └── daily.yml            ← the daily robot (schedule + publish)
├── scripts/
│   ├── fetch_news.py            ← the daily fetcher (commented, plain Python)
│   ├── feeds.json               ← YOUR control panel: feeds, sections, name, timezone
│   ├── business_terms.json      ← 40 hand-written Business Words of the Day
│   ├── requirements.txt         ← the two Python libraries needed
│   ├── test_fetcher.py          ← offline self-checks for the fetcher
│   └── test_bookmarks.mjs       ← offline self-checks for the bookmark system
└── docs/                        ← the website itself (this folder gets published)
    ├── index.html               ← page skeleton
    ├── assets/
    │   ├── style.css            ← the broadsheet look
    │   ├── app.js               ← draws the page, dashboard, reader
    │   └── bookmarks.js         ← profiles + saved articles
    └── data/                    ← written by the robot every morning
        ├── latest.json          ← today's edition
        ├── 2026-11-14.json      ← dated archive (sample at first)
        └── index.json           ← list of available dates
```

The folder is called `docs` because that's a name GitHub Pages understands, not because it holds documentation.

---

## Setup for complete beginners (about 15 minutes, no coding)

You need: a web browser, an email address, and this folder unzipped on your computer.

### Part A: Put it on GitHub and turn it on

**1. Create a free GitHub account.** Go to <https://github.com>, click **Sign up**, and follow the steps.

**2. Create an empty repository.** Click the **+** at the top right → **New repository**.
- Repository name: `morning-edition` (any name works)
- Choose **Public**. Free GitHub Pages hosting needs a public repository.
- Leave "Add a README" **unticked**.
- Click **Create repository**.

**3. Upload the files.** On the new empty repository page click the link **uploading an existing file**. Open the unzipped `morning-edition` folder on your computer, select **everything inside it**, and drag it into the browser window. Scroll down and click **Commit changes**.

> **Hidden-folder gotcha.** The folder `.github` starts with a dot, so Mac and Windows hide it. If the upload misses it:
> - *Mac:* in Finder press **Cmd + Shift + .** (full stop) to show hidden files, then drag again.
> - *Windows:* in File Explorer choose **View → Show → Hidden items**.
> - *Or skip dragging:* in your repository click **Add file → Create new file**, type `.github/workflows/daily.yml` as the name (typing the slashes creates the folders), paste in the contents of that file, and click **Commit changes**.
>
> To check, open your repository and look for `.github/workflows/daily.yml`.

**4. Switch on GitHub Pages.** Go to **Settings → Pages**. Under **Build and deployment**, set **Source** to **GitHub Actions**. (It saves automatically.)

**5. Allow the robot to save files.** Go to **Settings → Actions → General**, scroll to **Workflow permissions**, choose **Read and write permissions**, and click **Save**.

**6. Run the first edition.** Click the **Actions** tab. If you see a green button saying *"I understand my workflows, go ahead and enable them"*, click it. Then click **Daily Morning Edition** in the left list → **Run workflow** → **Run workflow**. Wait 2 to 4 minutes until you see a green tick.

**7. Open your newspaper.** Go to **Settings → Pages**. Your address appears at the top, in the form:

```
https://YOUR-GITHUB-NAME.github.io/morning-edition/
```

Bookmark it. On a phone, use **Add to Home Screen** so it opens like an app.

From now on the robot runs **every morning by itself**.

### Part B (alternative): Deploy on Vercel instead

Vercel is another free host. It also redeploys on its own each time the robot saves a new edition.

1. Complete Part A steps 1 to 6 (the robot still creates the daily data on GitHub).
2. Go to <https://vercel.com> and click **Sign Up → Continue with GitHub**.
3. Click **Add New → Project**, choose your `morning-edition` repository, and click **Import**.
4. Leave **Framework Preset** as *Other* and **Build Command** empty. `vercel.json` already tells it to publish the `docs` folder.
5. Click **Deploy**. You get an address like `https://morning-edition-yourname.vercel.app`.

You can use Vercel *and* Pages together, or turn off the "deploy" job in `daily.yml` if you only want Vercel.

---

## Using your newspaper

- **Read.** Headlines open the original article in a new tab. For openly licensed sources (marked *"min read"* and carrying a licence tag) the headline opens a clean **reader view** with the full text.
- **Trending keywords.** Tap one to show only stories mentioning it. Tap again to clear it.
- **Past editions.** Use the date drop-down in the top bar (it appears once there are at least two editions).
- **Text size, day/night.** The `A−`, `A+` and `Day/Night` buttons remember your choice.
- **Print.** Use your browser's Print command for a paper-friendly layout.

### Saving favourite articles (your profile)

1. Tap **☆ Save** on any story. The first time, a panel asks **your name** (e.g. "Asha"). That creates your profile.
2. Saved stories appear under **★ Saved** in the top bar, newest first, searchable.
3. Several people can share one device: create a profile for each and pick who is **Reading as** from the drop-down.
4. Each save keeps its own copy of the headline, link, source and excerpt, so it stays in your list after that day's edition rotates away.

**Where is my data?** Only in *this browser on this device* (the browser's built-in `localStorage`). Nothing is uploaded, so there is no database to maintain. The trade-off is that clearing your browser data erases the list, so:

- **Download JSON** is your backup. **Import JSON** restores it, on this device or another.
- **Download Markdown** gives a tidy reading list you can open in any notes app.
- If you want your backups kept in the repository, add the downloaded file to a folder in your repo. Remember that a public repository is public. The `.gitignore` excludes a folder named `my-bookmarks/` so you don't do it by accident.

---

## Make it yours (all edits happen in `scripts/feeds.json`)

On GitHub, open `scripts/feeds.json`, click the **pencil icon**, edit, then **Commit changes**. Your change triggers a fresh build automatically.

| I want to… | Change this |
|---|---|
| Rename the paper | `edition.name` and `edition.tagline` |
| Show times in my timezone | `edition.timezone`, using a name like `Europe/London` or `America/New_York` ([list](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones)) |
| Add a news source | Copy one `{ "name": ..., "url": ... }` line into the right section. Find a site's feed by looking for an RSS icon or `/feed` at the end of its address. |
| Remove a source | Delete its line (watch the commas) |
| More or fewer stories | `limits.per_feed`, `limits.per_section` |
| Longer or shorter excerpts | `limits.summary_words` |
| Different market indicators | `markets` block |
| Hide the dictionary word | `dictionary_word.enabled` → `false` |

JSON is picky: every item in a list is followed by a comma **except the last one**, and all text sits in straight double quotes. If a build fails after an edit, a stray comma is almost always why.

### Change the delivery time

In `.github/workflows/daily.yml`, edit the `cron` line. GitHub uses **UTC**.

| You want the paper at… | Use |
|---|---|
| 06:00 India (IST) | `"30 0 * * *"` |
| 07:00 India (IST) | `"30 1 * * *"` |
| 06:00 UK, winter / summer | `"0 6 * * *"` / `"0 5 * * *"` |
| 06:00 US Eastern, winter / summer | `"0 11 * * *"` / `"0 10 * * *"` |
| 06:00 US Pacific, winter / summer | `"0 14 * * *"` / `"0 13 * * *"` |
| 06:00 Singapore | `"0 22 * * *"` |
| 06:00 Dubai | `"0 2 * * *"` |

GitHub can start scheduled jobs several minutes late. If a repository sits idle for a long time GitHub may pause its schedule; if so, open the **Actions** tab and click **Enable**.

---

## Optional: run it on your own computer

```bash
# one-time: install Python 3.10 or newer from python.org, then in the repo folder:
pip install -r scripts/requirements.txt

python scripts/fetch_news.py            # build today's edition
python scripts/fetch_news.py --sample   # offline demo data (no internet needed)

cd docs && python -m http.server 8000   # then open http://localhost:8000
```

Opening `index.html` by double-clicking will **not** work, because browsers block a page from reading data files that way. Use the small local server above.

Self-checks (no internet needed): `python -m unittest scripts/test_fetcher.py` and `node scripts/test_bookmarks.mjs`.

---

## Compliance & ethics: how this stays on the right side of copyright and terms of service

| Concern | What the code does |
|---|---|
| Copying articles | By default only the **headline, a short excerpt (about 45 words, the opening sentences of what the publisher's own feed supplies) and a link back** are shown. Nothing is rewritten or passed off as original. |
| Full articles | Shown **only** for feeds you mark `"full_text": true` in `feeds.json`. As shipped these are Global Voices (CC BY 3.0) and Wikinews (CC BY 2.5), both openly licensed. Each full-text view shows source, author, licence link and a note that images and ads were removed. |
| Paywalls & ads | Nothing behind a login or paywall is fetched. Ads, scripts, images and trackers are stripped from full-text articles. Headlines link to the publisher's own page, which is *theirs*, so it may show its own ads. |
| Scraping | **None.** Only public RSS/Atom feeds and three open data APIs are used. No HTML pages are scraped and no site is crawled. |
| Being polite | A clear `User-Agent`, one request per feed per day, and a short pause between requests. |
| Attribution | Every card names its source. The footer lists all sources with licence links. Dictionary words credit Wiktionary (CC BY-SA 4.0). |
| Plagiarism | The *Business Word of the Day* definitions are original text written for this project. Excerpts are extracted, not generated, so no AI text is passed off as reporting. |
| Markets data | Stooq (indices), the European Central Bank via Frankfurter (currencies), CoinGecko (crypto). All have free public endpoints; each figure shows its source. Informational only, not investment advice. |
| Privacy | No analytics, cookies or accounts. Saved articles never leave your browser. |
| Trademarks | The design is original, with its own name and no logos or branding from any newspaper. |

**Things to check yourself:**
- **Feed addresses change.** Some publishers move or retire feeds. A dead feed is skipped, and the page footer lists the warnings. Check the Actions log after your first run, then edit `feeds.json` to fix or remove anything that failed.
- **Terms of use differ by publisher.** Using public feeds for personal reading is the intended use of RSS, but a *public website* re-displaying excerpts is a form of redistribution. If you're unsure about a publisher, remove it from `feeds.json` or switch the site to personal use only (run it locally, as above). A public GitHub Pages site can be opened by anyone with the link; the page asks search engines not to index it, but that's a request, not a lock.
- **Adding `full_text: true`** is your responsibility. Only use it for content whose licence clearly permits republication (Creative Commons with attribution, government works), and keep the `license` and `license_url` fields filled in.

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| Page says "This is a SAMPLE edition" | The first run hasn't finished. Run the workflow (step 6) and refresh. |
| Page shows "Could not load the edition" | You're opening the file directly. Use your Pages/Vercel address or the local server. |
| Actions run fails at "Fetch today's edition" | Every feed failed (often a network blip, or all feed addresses outdated). Re-run; check the log lines starting with `!`. |
| Actions run fails at "Save the new edition" | Do step 5 (Read and write permissions). |
| "Pages" settings has no GitHub Actions option | Make sure the repository is Public, and that `.github/workflows/daily.yml` exists. |
| A section says no stories today | Its feeds were down or had nothing recent. Add another feed to that section. |
| Saved articles vanished | Browser data was cleared, or you're in a private window. Restore from your JSON backup. |

---

## Honest limits

- **Summaries are extractive** (the opening sentences from the publisher's feed), not AI-written. That's deliberate: it needs no API key and avoids reshaping someone else's work. The `summarize()` function in `fetch_news.py` is the one place to extend if you later want an AI summariser.
- **"FinTech & Tax Technology"** draws on general fintech news, because free, dedicated tax-technology feeds are scarce. Add vendor or association blogs you trust.
- **Index "change" figures** are measured from the day's open (Stooq's free quote has no previous close) and may be delayed.
- **Reading time** is estimated from what's shown on the page (excerpts plus any full-text pieces) at 230 words per minute, not the length of the original articles.

Code: MIT licence. News content: © its publishers, shown as described above.
