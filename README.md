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
- Copy output to clipboard
- Clear workspace action
- Configurable indentation
- Input and output text statistics
- Local-only processing
- Modular JavaScript architecture
- Responsive dark interface

## Planned Features

- Improved JSON validation messages
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
        notifications.js
        theme.js

desktop/
  README.md

docs/
  privacy.md
  roadmap.md