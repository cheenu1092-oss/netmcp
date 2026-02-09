---
name: threegpp-specs
description: Search 3GPP specifications for 5G NR, LTE, core network, and security standards. Use when looking up mobile network standards, 5G spec numbers, protocol specifications, 3GPP release contents, or any cellular technology standards (NR, E-UTRA, NAS, RRC, NGAP, etc.).
---

# 3GPP Specs — 5G/LTE Standards Search

## Quick Start

```bash
cd SKILL_DIR/../../packages/threegpp-specs
npm install && node src/index.js
```

## Tools Available

### `spec_search` — Search specifications
Input: Spec number or keyword (e.g. "23.501", "5G security", "NR physical layer")
Returns: Matching specs with title, responsible group, releases, archive link

### `spec_get` — Get details for a specific spec
Input: Spec number (e.g. "TS 23.501", "38.300")
Returns: Full spec details including release history

### `spec_releases` — List specs by release
Input: Release number (15, 16, 17, 18)
Returns: Release info and all curated specs in that release

## Key Releases

- **Release 15** (2018): 5G Phase 1 — NSA + SA
- **Release 16** (2020): 5G Phase 2 — URLLC, V2X, NPN
- **Release 17** (2022): 5G-Advanced prep — NTN, RedCap, XR
- **Release 18** (2024): 5G-Advanced — AI/ML, Ambient IoT

## Key Specs to Know

- **TS 23.501**: 5G System Architecture (the "bible" of 5G)
- **TS 38.300**: NR Overall Description (5G radio overview)
- **TS 38.331**: NR RRC (Radio Resource Control)
- **TS 33.501**: 5G Security Architecture
- **TS 29.500**: 5G Service-Based Architecture

## Data Source

3GPP FTP Archive: `www.3gpp.org/ftp/Specs/archive/` — Public, no auth. Curated database of 40+ key specs plus live FTP directory scraping.

## Examples

- "What's in TS 23.501?" → `spec_get` with "23.501"
- "Find 5G security specs" → `spec_search` with "security"
- "What's new in Release 18?" → `spec_releases` with release 18
- "Show me NR physical layer specs" → `spec_search` with "NR physical"
