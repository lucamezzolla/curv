from pathlib import Path

ROOT = Path.cwd()
INDEX = ROOT / "app" / "index.html"
README = ROOT / "README.md"
ROADMAP = ROOT / "docs" / "roadmap.md"

def read(path):
    return path.read_text(encoding="utf-8")

def write(path, content):
    path.write_text(content, encoding="utf-8")

def ensure_before(content, marker, insertion):
    if insertion.strip() in content:
        return content

    if marker not in content:
        raise RuntimeError(f"Marker not found: {marker}")

    return content.replace(marker, insertion + marker)

def update_index():
    content = read(INDEX)

    head_marker = '  <link rel="stylesheet" href="./assets/css/main.css" />\n'
    head_insertion = """  <link rel="icon" href="./assets/img/favicon.svg" type="image/svg+xml" />
  <link rel="manifest" href="./manifest.webmanifest" />

  <meta name="theme-color" content="#8b5cf6" />
  <meta property="og:title" content="Curv — Beautiful JSON tooling for developers" />
  <meta property="og:description" content="Privacy-first JSON formatting, validation, tree view, diff, converters and schema tools." />
  <meta property="og:type" content="website" />
  <meta property="og:image" content="./assets/img/social-preview.svg" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="Curv — Beautiful JSON tooling for developers" />
  <meta name="twitter:description" content="Privacy-first JSON formatting, validation, tree view, diff, converters and schema tools." />
  <meta name="twitter:image" content="./assets/img/social-preview.svg" />
"""

    content = ensure_before(content, head_marker, head_insertion)
    write(INDEX, content)

def update_readme():
    if not README.exists():
        return

    content = read(README)

    if "- Publish-ready metadata" not in content:
        content = content.replace(
            "- Converted output downloads with format-aware file extensions\n",
            "- Converted output downloads with format-aware file extensions\n"
            "- Publish-ready metadata\n"
            "- SVG favicon\n"
            "- Web app manifest\n"
            "- Social preview image\n"
            "- GitHub Pages publishing notes\n",
        )

    if "publishing.md" not in content:
        content = content.replace(
            "docs/\n  privacy.md\n  roadmap.md\n",
            "docs/\n  privacy.md\n  publishing.md\n  roadmap.md\n",
        )

    content = content.replace("v0.7.0 — Export & Preferences", "v0.8.0 — Publishing")

    write(README, content)

def update_roadmap():
    if not ROADMAP.exists():
        return

    content = read(ROADMAP)

    if "## v0.8.0 — Publishing" not in content:
        content += """

## v0.8.0 — Publishing

- Publish-ready metadata
- SVG favicon
- Web app manifest
- Social preview image
- GitHub Pages publishing notes
"""

    write(ROADMAP, content)

def main():
    update_index()
    update_readme()
    update_roadmap()
    print("Curv v0.8.0 publishing patch applied.")

if __name__ == "__main__":
    main()
