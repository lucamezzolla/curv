# Curv

Beautiful JSON tooling for developers.

[![Donate with PayPal](https://img.shields.io/badge/Donate-PayPal-00457C?logo=paypal&logoColor=white)](https://www.paypal.com/paypalme/lucamezzolla82)

Curv is a privacy-first, offline-ready JSON toolbox designed to help developers format, validate, inspect, compare and transform JSON with a clean and professional workflow.

## Vision

Curv aims to become a complete JSON workspace for developers who need a fast, elegant and reliable tool for everyday API, backend, configuration and data inspection tasks.

## Core Principles

- Privacy-first: JSON data stays local.
- Offline-ready: designed to work without a backend.
- Developer-focused: clean workflows, readable output and useful tooling.
- Elegant by default: professional interface and maintainable code.
- Extensible architecture: built to grow from formatter to full JSON studio.

## Current Features

- Browser-based JSON formatter
- JSON minifier
- JSON validation workflow
- Improved JSON error details when available
- JSON file upload
- Output download
- Copy output to clipboard
- Clear workspace action
- Keyboard shortcuts
- Auto-format on paste for valid JSON
- Configurable indentation
- Input and output text statistics
- Basic JSON structure analysis
- Local-only processing
- Modular JavaScript architecture
- Responsive dark interface

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl + Enter` / `Cmd + Enter` | Format JSON |
| `Ctrl + Shift + M` / `Cmd + Shift + M` | Minify JSON |
| `Ctrl + Shift + V` / `Cmd + Shift + V` | Validate JSON |
| `Ctrl + Shift + C` / `Cmd + Shift + C` | Copy output |
| `Ctrl + Backspace` / `Cmd + Backspace` | Clear workspace |

## Planned Features

- Syntax highlighting
- Tree view for nested data
- JSON diff and comparison
- JSON Schema generation and validation
- JSONPath queries
- JSON to YAML, CSV, XML and Markdown conversion
- JSON to Java records, Java classes and SQL helpers
- Web and desktop distribution

## Repository Structure

```text
app/
  index.html
  assets/
    css/
      main.css
    js/
      main.js
      core/
        analyzer.js
        formatter.js
        validator.js
      ui/
        editor.js
        fileActions.js
        notifications.js
        theme.js

desktop/
  README.md

docs/
  privacy.md
  roadmap.md
```

## Project Status

Curv is currently in early development.

The current version provides a working browser-based formatter interface with formatting, minification, validation, file upload, output download, copy, clear, keyboard shortcuts and basic text/structure statistics.

The next milestone focuses on syntax highlighting, tree view and stronger developer-focused inspection tools.

## Running Locally

Curv is a static web application. It does not require a backend, but it should be served through a local HTTP server because the app uses JavaScript modules.

From the project root, open the app at:

```text
http://localhost:8080/app/
```

### Option 1: Python 3

```bash
python3 -m http.server 8080
```

### Option 2: Node.js with `npx serve`

```bash
npx serve . -l 8080
```

### Option 3: Node.js with `npx http-server`

```bash
npx http-server . -p 8080
```

### Option 4: PHP built-in server

```bash
php -S localhost:8080
```

### Option 5: Ruby

```bash
ruby -run -e httpd . -p 8080
```

### Option 6: BusyBox

```bash
busybox httpd -f -p 8080
```

### Option 7: VS Code / VSCodium Live Server

You can also use a Live Server extension from VS Code or VSCodium.

Open the project folder, start the local server from the editor, then open the generated local URL and navigate to:

```text
/app/
```

### Why a local server?

Opening `app/index.html` directly from the filesystem may not work correctly in some browsers because Curv uses ES modules:

```html
<script type="module" src="./assets/js/main.js"></script>
```

Using a local HTTP server ensures the app behaves like it would in production.

## Development Branch

This project currently uses `development` as the active working branch.

```bash
git checkout development
```

## Versioning

The first foundation release is:

```text
v0.1.0
```

The current development track is:

```text
v0.2.0 — Editor Experience
```

## License

To be defined.
