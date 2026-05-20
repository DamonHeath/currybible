# WordPress Integration Plan

This prototype is static. The live site is a custom WordPress theme called `currybible`.

The aim is to move the approved design into the theme carefully, not replace the whole site blindly.

## Current theme files identified

From the uploaded site backup, the active custom theme contains:

```text
wp-content/themes/currybible/
├── footer.php
├── front-page.php
├── functions.php
├── header.php
├── index.php
├── page-cool-curries.php
├── page-curry-bible-europe.php
├── page-curry-bible-uk.php
├── page-our-mission.php
├── page-retro-games.php
├── page-return-visits.php
├── single.php
├── style.css
└── assets/
    ├── css/styles.css
    └── js/
```

## Integration phase 1: low-risk changes

These are the safest first changes:

1. Change homepage `Play Tetris` copy to `Enter the Arcade`.
2. Add `For Curry Houses` to the header navigation.
3. Strengthen the existing homepage owner section.
4. Add a bottom CTA to `single.php` review pages.
5. Add trust wording: `Review scores cannot be bought`.

## Integration phase 2: new templates

Create these new WordPress page templates:

```text
page-for-curry-houses.php
page-rankings.php
page-curry-map.php
page-approved.php
```

Then create matching WordPress pages in the admin dashboard and assign the templates.

## Integration phase 3: data structure

For the Rankings and Curry Map pages to become properly dynamic, add post meta fields to reviews:

- overall_score
- menu_choice_score
- service_score
- taste_score
- drinks_score
- value_score
- town_city
- restaurant_name
- byob
- reviewed_date
- review_category
- featured_listing

This can start manually using custom fields and later become a cleaner custom meta box.

## Integration phase 4: monetisation

Add the following once the structure is live:

- Jotform or WP form for restaurant enquiries
- Affiliate disclosure page
- Sponsored content policy page
- Email signup form
- Directory listing enquiry route

## Do not do this

Do not upload the prototype folder directly into the live theme.

Do not commit `wp-config.php`, database exports, or full WordPress backups into the Git repo.

Do not weaken the review brand by selling ratings.
