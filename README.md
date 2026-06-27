# InspectIC – Inspection Search Page

A single-page internal inspection/search interface built with plain HTML, CSS, and JavaScript. No framework, no build step, no backend required.

## How to Run

1. Download or clone the project folder.
2. Open `index.html` in any modern browser (Chrome, Firefox, Edge, Safari).
   - You can double-click the file directly, or
   - Use VS Code's Live Server extension for a local dev server.


## Features

| Feature | Details |
|---|---|
| Search box | Searches part number, manufacturer, lot number, and OCR text (live, case-insensitive) |
| Status filter | ALL / PASS / FAIL / REVIEW |
| Manufacturer filter | Dynamically built from the dataset |
| Result cards | Part number, manufacturer, lot number, date code, status badge, confidence score bar |
| Detail modal | Click any card to see barcode text, OCR text, remarks, full confidence bar |
| Empty state | Clear message when no records match |
| Responsive | Grid adjusts from 1 to 3+ columns |
| Statistics bar | Total / PASS / FAIL / REVIEW counts (bonus) |
| Sort by confidence | Highest or lowest first (bonus) |
| Low-confidence highlight | Cards with < 80% confidence have an amber border; modal shows a warning strip (bonus) |
| Comments | Inline section comments throughout the JS and CSS |

## File Structure

```
InspectIC/
└── index.html
└── styles.css
└── app.js

## Color Palette Used
| Token | Hex |
|---|---|
| Background | `#1A1A1A` |
| Surface | `#2A2A2A` |
| Accent / FAIL | `#DC1505` |
| Accent soft | `#AF280A` |
| PASS | `#2ECC71` |
| REVIEW | `#F0A500` |
| White | `#FFFFFF` |
| Light gray | `#B3B3B3` |


