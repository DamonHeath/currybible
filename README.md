# Curry Bible Profitable Prototype v2

A static GitHub Pages-ready mockup for the next Curry Bible layout.

This repo is deliberately separate from the live WordPress site. It is for visual review before integrating anything into `wp-content/themes/currybible/`.

## What changed in v2

- Header now uses a Curry Bible logo asset, not just a text title.
- Every visible mention of Curry Club has been refactored to Curry Bible.
- Original site personality is preserved through Our Story, Our Mission, Currier of the Month and Curry Cunt pages.
- The homepage is fuller and less bland.
- Affiliate/approved section now includes realistic example product cards.
- Curry Map remains a simple placeholder ready for a future Google Maps plugin.
- Arcade games are presented as dropdown banner sections.
- The commercial route for restaurant owners is clearer and stronger.

## Pages

- `index.html` — homepage
- `reviews.html` — review/archive structure
- `rankings.html` — leaderboard mockup
- `curry-map.html` — simple map/directory placeholder
- `arcade.html` — dropdown banner arcade games
- `for-curry-houses.html` — commercial lead page
- `approved.html` — affiliate/product examples
- `our-story.html` — respectful original-page placeholder
- `our-mission.html` — respectful original-page placeholder
- `awards.html` — Currier of the Month / Curry Cunt page
- `policies.html` — affiliate, sponsored and privacy placeholders

## GitHub Pages

1. Create a new GitHub repo.
2. Upload these files.
3. Go to **Settings → Pages**.
4. Choose **Deploy from branch**.
5. Select `main` and `/root`.

## WordPress integration plan

Do not paste this over the live theme. Take a clean backup first.

Likely live theme files to update later:

```txt
wp-content/themes/currybible/header.php
wp-content/themes/currybible/front-page.php
wp-content/themes/currybible/single.php
wp-content/themes/currybible/assets/css/styles.css
wp-content/themes/currybible/page-retro-games.php
```

Likely new templates later:

```txt
page-for-curry-houses.php
page-rankings.php
page-curry-map.php
page-approved.php
```

## Hard rule

Paid visibility is fine. Paid review scores are not.
