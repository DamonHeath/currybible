# Curry Bible Static GitHub Conversion

This is a static HTML/CSS/JavaScript conversion of the uploaded Curry Bible WordPress theme/site files for GitHub Pages review.

## What this is

- A GitHub-readable static version.
- Uses the original theme CSS from `wp-content/themes/currybible/assets/css/styles.css`.
- Uses the original JavaScript files from `wp-content/themes/currybible/assets/js/`.
- Copies the original uploaded media from `wp-content/uploads/`.
- Preserves the original header, homepage structure, archive page layouts, mission page and arcade page as closely as possible in static form.

## Important limitation

The WordPress upload did not include the live WordPress database export. WordPress posts, page content, categories, custom fields and featured image relationships normally live in the database, not in the theme files.

This conversion uses the available `llms.txt` post listing and the media folder to build static review/archive pages. For a 100% content-perfect static export, export the live site with a static export plugin or provide a database export.

## GitHub Pages

Upload this folder to a GitHub repo, then enable:

Settings → Pages → Deploy from branch → main → /root

## Local preview

Open `index.html` directly or run:

```bash
python -m http.server 8000
```

Then visit:

http://localhost:8000
