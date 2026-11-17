# Smart App PH Stays: demo assets

These are the photos and brand files for the demo storefronts. They were cleaned up on 17 Nov 2026:

- Flow makes two versions of every prompt, so for each slot the better one was picked by eye. The other was dropped.
- The logo and cover files you attached to Flow as references were also dropped.
- Every file was renamed to the naming convention and converted to WebP (quality 85, method 6). Logos use lossless WebP.

## Folders (one per brand)

```
<slug>/
  banners/     hero-1..3 and brand-cover, at native width (1376) and 800
  photos/      property-1..3 and the unit photos (<unit-slug>-<n>), at 1200, 800 and 400
  brand/       logo-symbol / logo-lockup / app-icon as SVG (the master files)
               logo-symbol-1024/256/128.webp, logo-lockup-2000/800/400.webp (lossless)
               icon-512.png, icon-192.png, apple-touch-icon-180.png (PNG for the PWA manifest and iOS)
               logo-in-context-1200/800.webp, brand-board-1600.webp
manifest.csv   every file, the original Flow file it came from, the hero descriptions and the alt text
```

- **Naming:** files are `<name>-<width>.webp`, the same as the food app's demo folders. Photo 1 of each unit is the cover.
- **Brands with photos:**
  - ulap-suites
  - bahay-batis
  - ilaw-residences
  - tita-lorna-dorm
- **Brand kit only:** sagwan-trips (MVP B).

## Notes for Phase 2

- **Size:** Flow downloaded these at 1K (1200 x 896 for 4:3, 1376 x 768 for 16:9). The Feature blueprint asks for heroes at 1600 x 900. These were not upscaled.
- **Crop:** unit photos are 4:3. Crop them to 3:2 in the app or in the image script, if wanted.
- **Originals:** the picked JPGs are in the separate originals zip. Keep them out of the repo.
