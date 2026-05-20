# Curry Bible Profitable Prototype

This repository is a **static visual prototype** for the next version of Curry Bible.

It is designed to be uploaded to GitHub and viewed through **GitHub Pages** without touching the live WordPress site at `currybible.co.uk`.

## What this prototype is

This is a clean HTML/CSS/JavaScript representation of the proposed profitable site structure:

- Homepage repositioned around reviews, rankings, owner enquiries, and audience capture
- New **For Curry Houses** commercial page
- New **Rankings** page
- New **Curry Map** / directory foundation
- New **Approved Gear** affiliate page
- Updated **Arcade** positioning
- Improved review/archive card direction
- Trust-first sponsored content policy

## What this prototype is not

This is **not** a WordPress theme yet.

Do not upload these files directly over the live `wp-content/themes/currybible` folder. This prototype is for visual review first. After it is approved, the layout should be integrated carefully into the custom WordPress theme templates.

## File structure

```text
curry-bible-profit-prototype/
├── index.html
├── reviews.html
├── rankings.html
├── curry-map.html
├── arcade.html
├── for-curry-houses.html
├── approved.html
├── assets/
│   ├── css/
│   │   └── styles.css
│   ├── js/
│   │   └── main.js
│   └── images/
│       ├── logo.svg
│       ├── favicon.svg
│       ├── hero-curry.jpg
│       ├── review-ranas.jpg
│       ├── review-curry-leaf.jpg
│       ├── review-shapla.jpg
│       ├── review-nur.jpg
│       └── approved-gear.jpg
├── docs/
│   ├── content-policy.md
│   ├── integration-plan.md
│   └── wireframe-notes.md
├── .gitignore
└── README.md
```

## How to view locally

Open `index.html` in your browser.

No build step is needed.

## How to put it on GitHub

1. Create a new folder on your computer.
2. Put all these files inside it.
3. Open that folder in VS Code.
4. Run:

```bash
git init
git add .
git commit -m "Initial Curry Bible profitable prototype"
```

5. Create a new GitHub repository.
6. Push this folder to GitHub.
7. In GitHub, go to:

```text
Settings → Pages → Deploy from branch → main → /root
```

8. GitHub will give you a preview URL.

## Recommended GitHub repo name

```text
curry-bible-profit-prototype
```

## Core commercial idea

Curry Bible should become:

> A brutally honest curry review brand with rankings, a local curry directory, reader community, and paid visibility opportunities for curry houses — without ever selling review scores.

## Strong rule

Paid visibility is fine.

Paid praise is poison.

Review scores must remain independent. If that trust goes, the whole brand loses its value.

## Suggested integration order after approval

1. Back up the live WordPress site.
2. Create a staging copy or local WordPress install.
3. Update the navigation in `header.php`.
4. Update homepage sections in `front-page.php`.
5. Add a `page-for-curry-houses.php` template.
6. Add a `page-rankings.php` template.
7. Add a `page-curry-map.php` template.
8. Add a `page-approved.php` template.
9. Add owner CTA blocks to `single.php`.
10. Move final CSS into `assets/css/styles.css`.
11. Test mobile layout before publishing.
