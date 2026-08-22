# ANYA — Digital Typography

A responsive, static GitHub Pages artwork that rebuilds a source portrait using a flowing canvas grid of repeated `ANYA` typography. Source pixels determine each text cell's color, brightness, and opacity, so the portrait becomes clear from a distance while the letterforms remain visible up close.

## Files

```text
anya-typography-art/
├── index.html
├── style.css
├── script.js
├── assets/
│   ├── .gitkeep
│   └── anya.png        # Add this image before publishing
└── README.md
```

`assets/.gitkeep` keeps the empty asset directory in Git. Replace it by adding your image as `assets/anya.png`.

## Run locally

No dependencies, build system, API keys, or server-side code are required. The site is a vanilla HTML, CSS, and JavaScript project. For the final artwork, make sure the source file exists at `assets/anya.png`; the app will show a clear source-image message until it is present.

## Deploy to GitHub Pages

1. Create or open the GitHub repository containing these files.
2. Upload `assets/anya.png` using that exact filename and path.
3. Open **Repository → Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select **main** as the branch and **/ (root)** as the folder.
6. Select **Save**.
7. After GitHub finishes publishing, open the URL shown in Pages. It will follow this pattern: `https://USERNAME.github.io/REPOSITORY-NAME/`.

All project references use relative paths, so the site works when published from a GitHub Pages repository subdirectory.

## Accessibility and performance

- Canvas fallback content and an accessible label explain the artwork.
- The compact offscreen sampling grid avoids per-pixel source processing.
- Rendering stays on one Canvas rather than generating thousands of DOM nodes.
- Device pixel ratio is capped at 2 to avoid excessive high-DPI work.
- `prefers-reduced-motion` stops the continuous typography flow.
- The small Tune control is keyboard accessible and exposes flow, density, and glow settings.

## Image credit

Use an image that you have permission to upload and publish. The source image is processed locally in the visitor's browser and is not sent to any server.
