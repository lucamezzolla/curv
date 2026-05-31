from pathlib import Path

ROOT = Path.cwd()
README = ROOT / "README.md"
PUBLISHING = ROOT / "docs" / "publishing.md"
ROADMAP = ROOT / "docs" / "roadmap.md"

LIVE_URL = "https://lucamezzolla.github.io/curv/"

def read(path):
    return path.read_text(encoding="utf-8")

def write(path, content):
    path.write_text(content, encoding="utf-8")

def update_readme():
    if not README.exists():
        return

    content = read(README)

    if "## Live Demo" not in content:
        marker = "## Vision\n"
        block = f"""## Live Demo

Curv is designed to be published on GitHub Pages:

```text
{LIVE_URL}
```

"""
        if marker in content:
            content = content.replace(marker, block + marker)
        else:
            content += "\n" + block

    if "- GitHub Pages deployment workflow" not in content:
        content = content.replace(
            "- GitHub Pages publishing notes\n",
            "- GitHub Pages publishing notes\n"
            "- GitHub Pages deployment workflow\n"
            "- robots.txt\n"
            "- sitemap.xml\n",
        )

    write(README, content)

def update_publishing():
    if not PUBLISHING.exists():
        return

    content = read(PUBLISHING)

    if LIVE_URL not in content:
        content = content.replace(
            "# Publishing Curv\n",
            f"# Publishing Curv\n\nPublic URL:\n\n```text\n{LIVE_URL}\n```\n\n"
        )

    if "## GitHub Actions Deployment" not in content:
        content += """

## GitHub Actions Deployment

Curv includes a GitHub Actions workflow at:

```text
.github/workflows/pages.yml
```

The workflow deploys the `app/` directory as the root of the GitHub Pages site.

Required GitHub repository setting:

```text
Settings → Pages → Build and deployment → Source: GitHub Actions
```

The workflow runs automatically on pushes to:

```text
development
```

It can also be started manually from the Actions tab.
"""

    write(PUBLISHING, content)

def update_roadmap():
    if not ROADMAP.exists():
        return

    content = read(ROADMAP)

    if "- GitHub Pages deployment workflow" not in content:
        content = content.replace(
            "- GitHub Pages publishing notes\n",
            "- GitHub Pages publishing notes\n"
            "- GitHub Pages deployment workflow\n"
            "- robots.txt\n"
            "- sitemap.xml\n",
        )

    write(ROADMAP, content)

def main():
    update_readme()
    update_publishing()
    update_roadmap()
    print("Curv GitHub Pages publishing patch applied.")

if __name__ == "__main__":
    main()
