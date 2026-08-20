# Photo Checklist

Every image slot the site currently supports, with the **exact filename and
folder** to use. Workflow: collect the photo → rename it exactly as shown →
drop it in the listed folder → the site picks it up automatically (every
image reference already points to these paths; nothing else needs to
change). Pages fail gracefully if a file is missing (they just hide that
image), so you can roll these in gradually — nothing breaks in the
meantime.

All destination and fleet images are **flat files** in
`public/img/destinations/` and `public/img/fleet/` respectively — this
matches the flat, single-hero-image layout the project started with,
extended minimally (adding a `-hero` / `-gallery-N` suffix to the existing
`<slug>.svg` pattern) rather than introducing a new per-destination folder
structure.

Suggested formats: `.jpg` for photos (as named below), transparent `.png`
for the logo. If you only have `.png` or `.webp` photos, use that extension
instead and update the matching `hero_image` / `gallery` path in
`data/seed.json` (or the fleet `<img>` `src` in `public/fleet.html`) to
match — the code doesn't require `.jpg` specifically, the filenames below
just need to stay in sync with what's in the data.

Recommended size: hero images ~1600×900 (16:9), gallery images ~1000×750,
fleet images ~1200×750, homepage hero ~1920×1080, logo ~400×400 transparent
PNG, favicon 512×512 PNG (browsers downscale automatically).

---

## Destinations (12 × 4 images = 48 photos)

Each destination needs one hero image and three gallery images.

### 1. Dar es Salaam
| # | Purpose | Depicts | Exact filename | Folder |
|---|---|---|---|---|
| 1 | Hero | A recognizable Dar es Salaam skyline or harbor view | `dar-es-salaam-hero.jpg` | `public/img/destinations/` |
| 2 | Gallery | City/harbor scene | `dar-es-salaam-gallery-1.jpg` | `public/img/destinations/` |
| 3 | Gallery | Street/market or cultural scene | `dar-es-salaam-gallery-2.jpg` | `public/img/destinations/` |
| 4 | Gallery | Beach or coastal scene | `dar-es-salaam-gallery-3.jpg` | `public/img/destinations/` |

### 2. Vipingo Ridge
| # | Purpose | Depicts | Exact filename | Folder |
|---|---|---|---|---|
| 1 | Hero | Golf course / coastal estate view | `vipingo-ridge-hero.jpg` | `public/img/destinations/` |
| 2 | Gallery | Golf course | `vipingo-ridge-gallery-1.jpg` | `public/img/destinations/` |
| 3 | Gallery | Beach club or resort facility | `vipingo-ridge-gallery-2.jpg` | `public/img/destinations/` |
| 4 | Gallery | Coastal/aerial scenery | `vipingo-ridge-gallery-3.jpg` | `public/img/destinations/` |

### 3. Mombasa
| # | Purpose | Depicts | Exact filename | Folder |
|---|---|---|---|---|
| 1 | Hero | Fort Jesus or Old Town skyline | `mombasa-hero.jpg` | `public/img/destinations/` |
| 2 | Gallery | Fort Jesus | `mombasa-gallery-1.jpg` | `public/img/destinations/` |
| 3 | Gallery | Old Town street | `mombasa-gallery-2.jpg` | `public/img/destinations/` |
| 4 | Gallery | Nyali Beach or coastline | `mombasa-gallery-3.jpg` | `public/img/destinations/` |

### 4. Lodwar
| # | Purpose | Depicts | Exact filename | Folder |
|---|---|---|---|---|
| 1 | Hero | Turkana landscape / Lodwar town | `lodwar-hero.jpg` | `public/img/destinations/` |
| 2 | Gallery | Lake Turkana | `lodwar-gallery-1.jpg` | `public/img/destinations/` |
| 3 | Gallery | Turkana cultural scene | `lodwar-gallery-2.jpg` | `public/img/destinations/` |
| 4 | Gallery | Arid-north landscape | `lodwar-gallery-3.jpg` | `public/img/destinations/` |

### 5. Ukunda
| # | Purpose | Depicts | Exact filename | Folder |
|---|---|---|---|---|
| 1 | Hero | Diani Beach | `ukunda-hero.jpg` | `public/img/destinations/` |
| 2 | Gallery | Diani Beach, different angle | `ukunda-gallery-1.jpg` | `public/img/destinations/` |
| 3 | Gallery | Kaya Kinondo forest | `ukunda-gallery-2.jpg` | `public/img/destinations/` |
| 4 | Gallery | Colobus monkeys / conservation area | `ukunda-gallery-3.jpg` | `public/img/destinations/` |

### 6. Malindi
| # | Purpose | Depicts | Exact filename | Folder |
|---|---|---|---|---|
| 1 | Hero | Malindi waterfront / Old Town | `malindi-hero.jpg` | `public/img/destinations/` |
| 2 | Gallery | Malindi Marine National Park | `malindi-gallery-1.jpg` | `public/img/destinations/` |
| 3 | Gallery | Vasco da Gama Pillar | `malindi-gallery-2.jpg` | `public/img/destinations/` |
| 4 | Gallery | Old Town street scene | `malindi-gallery-3.jpg` | `public/img/destinations/` |

### 7. Eldoret
| # | Purpose | Depicts | Exact filename | Folder |
|---|---|---|---|---|
| 1 | Hero | Eldoret town or Rift Valley view | `eldoret-hero.jpg` | `public/img/destinations/` |
| 2 | Gallery | Kerio Valley viewpoint | `eldoret-gallery-1.jpg` | `public/img/destinations/` |
| 3 | Gallery | Rift Valley scenery | `eldoret-gallery-2.jpg` | `public/img/destinations/` |
| 4 | Gallery | Town/city scene | `eldoret-gallery-3.jpg` | `public/img/destinations/` |

### 8. Kitale
| # | Purpose | Depicts | Exact filename | Folder |
|---|---|---|---|---|
| 1 | Hero | Mount Elgon or Kitale scenery | `kitale-hero.jpg` | `public/img/destinations/` |
| 2 | Gallery | Mount Elgon National Park | `kitale-gallery-1.jpg` | `public/img/destinations/` |
| 3 | Gallery | Saiwa Swamp National Park | `kitale-gallery-2.jpg` | `public/img/destinations/` |
| 4 | Gallery | Kitale Museum or town scene | `kitale-gallery-3.jpg` | `public/img/destinations/` |

### 9. Lamu
| # | Purpose | Depicts | Exact filename | Folder |
|---|---|---|---|---|
| 1 | Hero | Lamu Old Town waterfront | `lamu-hero.jpg` | `public/img/destinations/` |
| 2 | Gallery | Lamu Old Town street | `lamu-gallery-1.jpg` | `public/img/destinations/` |
| 3 | Gallery | Shela Beach | `lamu-gallery-2.jpg` | `public/img/destinations/` |
| 4 | Gallery | Dhow sailing scene | `lamu-gallery-3.jpg` | `public/img/destinations/` |

### 10. Migori
| # | Purpose | Depicts | Exact filename | Folder |
|---|---|---|---|---|
| 1 | Hero | Migori town or western Kenya landscape | `migori-hero.jpg` | `public/img/destinations/` |
| 2 | Gallery | Local market scene | `migori-gallery-1.jpg` | `public/img/destinations/` |
| 3 | Gallery | Lake Victoria basin scenery | `migori-gallery-2.jpg` | `public/img/destinations/` |
| 4 | Gallery | Maasai Mara western-access landscape | `migori-gallery-3.jpg` | `public/img/destinations/` |

### 11. Nairobi
| # | Purpose | Depicts | Exact filename | Folder |
|---|---|---|---|---|
| 1 | Hero | Nairobi skyline | `nairobi-hero.jpg` | `public/img/destinations/` |
| 2 | Gallery | David Sheldrick Wildlife Trust | `nairobi-gallery-1.jpg` | `public/img/destinations/` |
| 3 | Gallery | Nairobi National Park (wildlife with skyline backdrop) | `nairobi-gallery-2.jpg` | `public/img/destinations/` |
| 4 | Gallery | Giraffe Centre | `nairobi-gallery-3.jpg` | `public/img/destinations/` |

### 12. Kisumu
| # | Purpose | Depicts | Exact filename | Folder |
|---|---|---|---|---|
| 1 | Hero | Kisumu waterfront on Lake Victoria | `kisumu-hero.jpg` | `public/img/destinations/` |
| 2 | Gallery | Lake Victoria boat scene | `kisumu-gallery-1.jpg` | `public/img/destinations/` |
| 3 | Gallery | Kisumu Impala Sanctuary | `kisumu-gallery-2.jpg` | `public/img/destinations/` |
| 4 | Gallery | Kit Mikayi rock formation | `kisumu-gallery-3.jpg` | `public/img/destinations/` |

---

## Fleet (4 photos)

| # | Aircraft | Purpose | Depicts | Exact filename | Folder |
|---|---|---|---|---|---|
| 1 | Skyward Dash 8-200 | Card image | The turboprop, ideally on the ground at a regional airstrip | `ac-dash8.jpg` | `public/img/fleet/` |
| 2 | Skyward E190 | Card image | The regional jet | `ac-e190.jpg` | `public/img/fleet/` |
| 3 | Skyward 738 | Card image | The 737-800 used on the Dar es Salaam route | `ac-738.jpg` | `public/img/fleet/` |
| 4 | Skyward A320 | Card image | The A320neo (reserved for future routes) | `ac-a320.jpg` | `public/img/fleet/` |

---

## Site-wide (3 photos)

| # | Page/Component | Purpose | Depicts | Exact filename | Folder | Notes |
|---|---|---|---|---|---|---|
| 1 | Homepage hero | Background visual behind the flight search | A wide aviation/travel shot — an aircraft, an airstrip, or a signature Kenyan landscape | `homepage-hero.jpg` | `public/img/` | Shown at 35% opacity under a green gradient overlay; a busy photo will still read fine |
| 2 | Header / footer | Company logo | Your logo, ideally on a transparent background | `logo.png` | `public/img/` | After adding this file, set `LOGO_URL=/img/logo.png` in `.env` (or edit the default in `config/site.config.js`) — it currently points at a placeholder |
| 3 | Browser tab | Favicon | A simplified square mark/icon | `favicon.png` | `public/img/` | Set `FAVICON_URL=/img/favicon.png` the same way |

---

## Not required to supply

- **Deals section** — reuses each deal's linked destination image
  automatically (via `destination_slug` in `data/seed.json`); no separate
  deal photos needed.
- **Admin dashboard** — no customer-facing photography.
