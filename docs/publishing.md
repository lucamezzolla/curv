# Publishing Curv

Curv is a static web application and can be published with GitHub Pages or any static hosting provider.

## GitHub Pages

Recommended configuration:

- Source: deploy from branch
- Branch: `development` or a dedicated release branch
- Folder: `/app`

If GitHub Pages is configured to serve `/app`, the public URL will point directly to Curv's web interface.

## Local Verification

Before publishing:

```bash
python3 -m http.server 8090
```

Open:

```text
http://localhost:8090/app/
```

Run a full smoke test:

- Format
- Minify
- Validate
- Tree View
- Diff
- Converters
- Schema & Query
- Theme preference
- Downloads
- PayPal support badge
- Responsive layout

## Static Hosting Notes

Curv does not require a backend.

All processing happens locally in the browser.
