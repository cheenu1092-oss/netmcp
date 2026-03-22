# iana-media-types

IANA Media Types (MIME types) lookup MCP server - content types, file extensions, and encoding information.

## Features

- **5 MCP tools:**
  - `media_by_extension` - Look up media type(s) by file extension
  - `media_by_type` - Look up media type by full type string
  - `media_search` - Search media types by keyword
  - `media_by_category` - Get media types by category
  - `media_stats` - Database and performance statistics

- **80+ curated media types** across 9 categories
- **File extension lookups** (e.g., .jpg → image/jpeg)
- **Content type lookups** (e.g., application/json → JSON data)
- **Category filtering** (text, image, audio, video, application, font, multipart, model, message)
- **Instant lookups** (no external API calls)

## Quick Start

```bash
# Install dependencies
cd packages/iana-media-types
npm install

# Start MCP server (stdio transport)
npm start
```

## MCP Client Configuration

Add to your MCP client settings:

```json
{
  "mcpServers": {
    "iana-media-types": {
      "command": "node",
      "args": ["path/to/packages/iana-media-types/src/index.js"]
    }
  }
}
```

## Usage Examples

### 1. Look up media type by file extension

```
User: What is the media type for .json files?
AI: Let me check...
→ Tool: media_by_extension
→ Input: { "extension": ".json" }
← Result: {
    "extension": ".json",
    "found": true,
    "count": 1,
    "results": [
      {
        "type": "application/json",
        "category": "application",
        "subtype": "json",
        "extensions": [".json"],
        "description": "JSON data",
        "encoding": "UTF-8",
        "rfc": "RFC 8259"
      }
    ]
  }
```

### 2. Look up by full media type string

```
User: What is image/webp?
AI: Let me check...
→ Tool: media_by_type
→ Input: { "type": "image/webp" }
← Result: {
    "type": "image/webp",
    "found": true,
    "result": {
      "type": "image/webp",
      "category": "image",
      "subtype": "webp",
      "extensions": [".webp"],
      "description": "WebP image"
    }
  }
```

### 3. Search media types by keyword

```
User: What media types are available for video?
AI: Let me search...
→ Tool: media_search
→ Input: { "query": "video", "limit": 10 }
← Result: {
    "query": "video",
    "total_found": 7,
    "returned": 7,
    "results": [
      { "type": "video/mp4", "description": "MPEG-4 video", ... },
      { "type": "video/webm", "description": "WebM video", ... },
      { "type": "video/mpeg", "description": "MPEG video", ... },
      ...
    ]
  }
```

### 4. Get media types by category

```
User: Show me all audio media types
AI: Let me get those...
→ Tool: media_by_category
→ Input: { "category": "audio" }
← Result: {
    "query": "category:audio",
    "total_found": 8,
    "returned": 8,
    "results": [
      { "type": "audio/mpeg", "extensions": [".mp3"], ... },
      { "type": "audio/wav", "extensions": [".wav"], ... },
      { "type": "audio/ogg", "extensions": [".ogg", ".oga"], ... },
      ...
    ]
  }
```

### 5. Database statistics

```
User: How many media types are in the database?
AI: Let me get stats...
→ Tool: media_stats
← Result: {
    "total_media_types": 80,
    "by_category": {
      "text": 8,
      "image": 9,
      "audio": 8,
      "video": 7,
      "application": 32,
      "font": 4,
      "multipart": 4,
      "model": 4,
      "message": 2
    },
    "total_queries": 5,
    "curated_hits": 5,
    "curated_hit_rate_percent": 100.0,
    "top_extensions": [".txt", ".html", ".jpg", ".png", ".mp3", ".mp4", ".json", ".xml", ".pdf", ".zip"]
  }
```

## Understanding Media Types (MIME Types)

### Structure
Media types follow the format: `type/subtype[+suffix]`

- **Type:** Top-level category (text, image, audio, video, application, etc.)
- **Subtype:** Specific format (html, jpeg, mp3, json, etc.)
- **Suffix:** Optional (e.g., `+xml`, `+json`)

Examples:
- `text/html` → HTML document (type: text, subtype: html)
- `application/json` → JSON data (type: application, subtype: json)
- `image/svg+xml` → SVG image (type: image, subtype: svg, suffix: xml)

### Categories

| Category | Description | Example Types |
|----------|-------------|---------------|
| text | Plain text and markup | text/plain, text/html, text/css |
| image | Image formats | image/jpeg, image/png, image/webp |
| audio | Audio formats | audio/mpeg, audio/wav, audio/ogg |
| video | Video formats | video/mp4, video/webm, video/mpeg |
| application | Structured data, documents, executables | application/json, application/pdf, application/zip |
| font | Font formats | font/woff, font/woff2, font/ttf |
| multipart | Multiple parts (email, uploads) | multipart/form-data, multipart/mixed |
| model | 3D models | model/gltf+json, model/obj, model/stl |
| message | Email and messaging | message/rfc822, message/http |

### Common Use Cases

- **HTTP Content-Type header:** `Content-Type: application/json; charset=utf-8`
- **File upload validation:** Check if uploaded file matches expected MIME type
- **API responses:** Specify response format (JSON, XML, HTML)
- **Email attachments:** Identify attachment types
- **Browser behavior:** Determines how browser handles downloaded files

## Data Source

- **Source:** IANA Media Types Registry + curated database
- **Registry:** https://www.iana.org/assignments/media-types/media-types.xhtml
- **Coverage:** 80+ most common media types across 9 categories
- **Database:** Local curated list (no external API calls)
- **License:** IANA data is public domain

## RFC References

Common RFC standards referenced:
- RFC 2046: MIME (Multipurpose Internet Mail Extensions)
- RFC 8259: JSON data format
- RFC 7303: XML media types
- RFC 8081: Web fonts (WOFF, WOFF2)
- RFC 7578: Multipart form data
- RFC 8118: PDF media type

## License

MIT
