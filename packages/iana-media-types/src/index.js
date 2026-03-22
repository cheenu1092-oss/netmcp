/**
 * @file IANA Media Types MCP Server
 * Provides IANA media type (MIME type) lookup tools for content types, file extensions, and encoding.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

/**
 * @typedef {object} MediaTypeEntry
 * @property {string} type - Full media type (e.g., "text/html")
 * @property {string} category - Top-level category (text, image, audio, video, application, etc.)
 * @property {string} subtype - Subtype (html, jpeg, mp3, etc.)
 * @property {string[]} extensions - Common file extensions (e.g., [".html", ".htm"])
 * @property {string} description - Human-readable description
 * @property {string} [encoding] - Character encoding (for text types)
 * @property {string} [rfc] - RFC reference (e.g., "RFC 2046")
 * @property {boolean} [deprecated] - Whether the media type is deprecated
 */

/**
 * @typedef {object} MediaSearchResult
 * @property {string} query - Original search query
 * @property {number} total_found - Number of results found
 * @property {number} returned - Number of results returned (after limit)
 * @property {MediaTypeEntry[]} results - Matching media types
 */

/**
 * @typedef {object} MediaStatsResult
 * @property {number} total_media_types - Total curated media types
 * @property {Record<string, number>} by_category - Count by category (text, image, etc.)
 * @property {number} total_queries - Total queries processed
 * @property {number} curated_hits - Queries satisfied by curated database
 * @property {number} curated_hit_rate_percent - Percentage of queries served from cache
 * @property {string[]} top_extensions - Most common file extensions
 */

/**
 * Curated IANA media types database (80+ common types)
 * @type {MediaTypeEntry[]}
 */
const MEDIA_TYPES = [
  // Text types
  { type: 'text/plain', category: 'text', subtype: 'plain', extensions: ['.txt'], description: 'Plain text', encoding: 'UTF-8', rfc: 'RFC 2046' },
  { type: 'text/html', category: 'text', subtype: 'html', extensions: ['.html', '.htm'], description: 'HTML document', encoding: 'UTF-8', rfc: 'RFC 2854' },
  { type: 'text/css', category: 'text', subtype: 'css', extensions: ['.css'], description: 'Cascading Style Sheets', encoding: 'UTF-8', rfc: 'RFC 2318' },
  { type: 'text/javascript', category: 'text', subtype: 'javascript', extensions: ['.js', '.mjs'], description: 'JavaScript code', encoding: 'UTF-8', rfc: 'RFC 9239' },
  { type: 'text/csv', category: 'text', subtype: 'csv', extensions: ['.csv'], description: 'Comma-separated values', encoding: 'UTF-8', rfc: 'RFC 4180' },
  { type: 'text/xml', category: 'text', subtype: 'xml', extensions: ['.xml'], description: 'XML document', encoding: 'UTF-8', rfc: 'RFC 7303' },
  { type: 'text/markdown', category: 'text', subtype: 'markdown', extensions: ['.md', '.markdown'], description: 'Markdown text', encoding: 'UTF-8', rfc: 'RFC 7763' },
  { type: 'text/calendar', category: 'text', subtype: 'calendar', extensions: ['.ics'], description: 'iCalendar format', encoding: 'UTF-8', rfc: 'RFC 5545' },

  // Image types
  { type: 'image/jpeg', category: 'image', subtype: 'jpeg', extensions: ['.jpg', '.jpeg'], description: 'JPEG image', rfc: 'RFC 2046' },
  { type: 'image/png', category: 'image', subtype: 'png', extensions: ['.png'], description: 'PNG image', rfc: 'RFC 2083' },
  { type: 'image/gif', category: 'image', subtype: 'gif', extensions: ['.gif'], description: 'GIF image', rfc: 'RFC 2046' },
  { type: 'image/webp', category: 'image', subtype: 'webp', extensions: ['.webp'], description: 'WebP image' },
  { type: 'image/svg+xml', category: 'image', subtype: 'svg+xml', extensions: ['.svg'], description: 'Scalable Vector Graphics', rfc: 'RFC 7303' },
  { type: 'image/x-icon', category: 'image', subtype: 'x-icon', extensions: ['.ico'], description: 'Icon format' },
  { type: 'image/avif', category: 'image', subtype: 'avif', extensions: ['.avif'], description: 'AVIF image' },
  { type: 'image/heic', category: 'image', subtype: 'heic', extensions: ['.heic'], description: 'HEIC image (Apple)' },
  { type: 'image/tiff', category: 'image', subtype: 'tiff', extensions: ['.tif', '.tiff'], description: 'Tagged Image File Format', rfc: 'RFC 3302' },

  // Audio types
  { type: 'audio/mpeg', category: 'audio', subtype: 'mpeg', extensions: ['.mp3'], description: 'MP3 audio', rfc: 'RFC 3003' },
  { type: 'audio/wav', category: 'audio', subtype: 'wav', extensions: ['.wav'], description: 'Waveform audio' },
  { type: 'audio/ogg', category: 'audio', subtype: 'ogg', extensions: ['.ogg', '.oga'], description: 'Ogg Vorbis audio', rfc: 'RFC 5334' },
  { type: 'audio/webm', category: 'audio', subtype: 'webm', extensions: ['.weba'], description: 'WebM audio' },
  { type: 'audio/aac', category: 'audio', subtype: 'aac', extensions: ['.aac'], description: 'Advanced Audio Coding' },
  { type: 'audio/flac', category: 'audio', subtype: 'flac', extensions: ['.flac'], description: 'Free Lossless Audio Codec' },
  { type: 'audio/midi', category: 'audio', subtype: 'midi', extensions: ['.mid', '.midi'], description: 'MIDI audio', rfc: 'RFC 6295' },
  { type: 'audio/x-m4a', category: 'audio', subtype: 'x-m4a', extensions: ['.m4a'], description: 'MPEG-4 audio' },

  // Video types
  { type: 'video/mp4', category: 'video', subtype: 'mp4', extensions: ['.mp4', '.m4v'], description: 'MPEG-4 video', rfc: 'RFC 4337' },
  { type: 'video/mpeg', category: 'video', subtype: 'mpeg', extensions: ['.mpeg', '.mpg'], description: 'MPEG video', rfc: 'RFC 2046' },
  { type: 'video/webm', category: 'video', subtype: 'webm', extensions: ['.webm'], description: 'WebM video' },
  { type: 'video/ogg', category: 'video', subtype: 'ogg', extensions: ['.ogv'], description: 'Ogg Theora video', rfc: 'RFC 5334' },
  { type: 'video/quicktime', category: 'video', subtype: 'quicktime', extensions: ['.mov', '.qt'], description: 'QuickTime video', rfc: 'RFC 6381' },
  { type: 'video/x-msvideo', category: 'video', subtype: 'x-msvideo', extensions: ['.avi'], description: 'AVI video' },
  { type: 'video/x-matroska', category: 'video', subtype: 'x-matroska', extensions: ['.mkv'], description: 'Matroska video' },

  // Application types (structured data)
  { type: 'application/json', category: 'application', subtype: 'json', extensions: ['.json'], description: 'JSON data', encoding: 'UTF-8', rfc: 'RFC 8259' },
  { type: 'application/xml', category: 'application', subtype: 'xml', extensions: ['.xml'], description: 'XML document', encoding: 'UTF-8', rfc: 'RFC 7303' },
  { type: 'application/yaml', category: 'application', subtype: 'yaml', extensions: ['.yaml', '.yml'], description: 'YAML data', encoding: 'UTF-8' },
  { type: 'application/toml', category: 'application', subtype: 'toml', extensions: ['.toml'], description: 'TOML configuration', encoding: 'UTF-8' },
  { type: 'application/ld+json', category: 'application', subtype: 'ld+json', extensions: ['.jsonld'], description: 'JSON-LD (Linked Data)', encoding: 'UTF-8', rfc: 'RFC 6839' },
  { type: 'application/geo+json', category: 'application', subtype: 'geo+json', extensions: ['.geojson'], description: 'GeoJSON geographic data', encoding: 'UTF-8', rfc: 'RFC 7946' },

  // Application types (documents)
  { type: 'application/pdf', category: 'application', subtype: 'pdf', extensions: ['.pdf'], description: 'PDF document', rfc: 'RFC 8118' },
  { type: 'application/rtf', category: 'application', subtype: 'rtf', extensions: ['.rtf'], description: 'Rich Text Format', rfc: 'RFC 1341' },
  { type: 'application/msword', category: 'application', subtype: 'msword', extensions: ['.doc'], description: 'Microsoft Word (legacy)' },
  { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', category: 'application', subtype: 'vnd.openxmlformats-officedocument.wordprocessingml.document', extensions: ['.docx'], description: 'Microsoft Word (OOXML)' },
  { type: 'application/vnd.ms-excel', category: 'application', subtype: 'vnd.ms-excel', extensions: ['.xls'], description: 'Microsoft Excel (legacy)' },
  { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', category: 'application', subtype: 'vnd.openxmlformats-officedocument.spreadsheetml.sheet', extensions: ['.xlsx'], description: 'Microsoft Excel (OOXML)' },
  { type: 'application/vnd.ms-powerpoint', category: 'application', subtype: 'vnd.ms-powerpoint', extensions: ['.ppt'], description: 'Microsoft PowerPoint (legacy)' },
  { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', category: 'application', subtype: 'vnd.openxmlformats-officedocument.presentationml.presentation', extensions: ['.pptx'], description: 'Microsoft PowerPoint (OOXML)' },
  { type: 'application/vnd.oasis.opendocument.text', category: 'application', subtype: 'vnd.oasis.opendocument.text', extensions: ['.odt'], description: 'OpenDocument Text' },
  { type: 'application/vnd.oasis.opendocument.spreadsheet', category: 'application', subtype: 'vnd.oasis.opendocument.spreadsheet', extensions: ['.ods'], description: 'OpenDocument Spreadsheet' },

  // Application types (archives)
  { type: 'application/zip', category: 'application', subtype: 'zip', extensions: ['.zip'], description: 'ZIP archive', rfc: 'RFC 8478' },
  { type: 'application/x-tar', category: 'application', subtype: 'x-tar', extensions: ['.tar'], description: 'TAR archive' },
  { type: 'application/gzip', category: 'application', subtype: 'gzip', extensions: ['.gz'], description: 'Gzip compressed', rfc: 'RFC 6713' },
  { type: 'application/x-bzip2', category: 'application', subtype: 'x-bzip2', extensions: ['.bz2'], description: 'Bzip2 compressed' },
  { type: 'application/x-7z-compressed', category: 'application', subtype: 'x-7z-compressed', extensions: ['.7z'], description: '7-Zip archive' },
  { type: 'application/x-rar-compressed', category: 'application', subtype: 'x-rar-compressed', extensions: ['.rar'], description: 'RAR archive' },

  // Application types (web)
  { type: 'application/octet-stream', category: 'application', subtype: 'octet-stream', extensions: ['.bin'], description: 'Binary data (generic)', rfc: 'RFC 2046' },
  { type: 'application/x-www-form-urlencoded', category: 'application', subtype: 'x-www-form-urlencoded', extensions: [], description: 'Form data (URL-encoded)', rfc: 'RFC 1866' },
  { type: 'application/x-sh', category: 'application', subtype: 'x-sh', extensions: ['.sh'], description: 'Shell script' },
  { type: 'application/x-httpd-php', category: 'application', subtype: 'x-httpd-php', extensions: ['.php'], description: 'PHP script' },
  { type: 'application/x-python-code', category: 'application', subtype: 'x-python-code', extensions: ['.py'], description: 'Python script' },
  { type: 'application/wasm', category: 'application', subtype: 'wasm', extensions: ['.wasm'], description: 'WebAssembly binary' },

  // Font types
  { type: 'font/woff', category: 'font', subtype: 'woff', extensions: ['.woff'], description: 'Web Open Font Format', rfc: 'RFC 8081' },
  { type: 'font/woff2', category: 'font', subtype: 'woff2', extensions: ['.woff2'], description: 'Web Open Font Format 2', rfc: 'RFC 8081' },
  { type: 'font/ttf', category: 'font', subtype: 'ttf', extensions: ['.ttf'], description: 'TrueType font' },
  { type: 'font/otf', category: 'font', subtype: 'otf', extensions: ['.otf'], description: 'OpenType font' },

  // Multipart types
  { type: 'multipart/form-data', category: 'multipart', subtype: 'form-data', extensions: [], description: 'Multipart form data (file uploads)', rfc: 'RFC 7578' },
  { type: 'multipart/byteranges', category: 'multipart', subtype: 'byteranges', extensions: [], description: 'Multiple byte ranges', rfc: 'RFC 7233' },
  { type: 'multipart/mixed', category: 'multipart', subtype: 'mixed', extensions: [], description: 'Mixed multipart data', rfc: 'RFC 2046' },
  { type: 'multipart/alternative', category: 'multipart', subtype: 'alternative', extensions: [], description: 'Alternative representations (email)', rfc: 'RFC 2046' },

  // Model types (3D)
  { type: 'model/gltf+json', category: 'model', subtype: 'gltf+json', extensions: ['.gltf'], description: 'glTF 3D model (JSON)', rfc: 'RFC 8110' },
  { type: 'model/gltf-binary', category: 'model', subtype: 'gltf-binary', extensions: ['.glb'], description: 'glTF 3D model (binary)', rfc: 'RFC 8110' },
  { type: 'model/obj', category: 'model', subtype: 'obj', extensions: ['.obj'], description: 'Wavefront OBJ 3D model' },
  { type: 'model/stl', category: 'model', subtype: 'stl', extensions: ['.stl'], description: 'STL 3D model (stereolithography)' },

  // Message types
  { type: 'message/rfc822', category: 'message', subtype: 'rfc822', extensions: ['.eml'], description: 'Email message', rfc: 'RFC 2046' },
  { type: 'message/http', category: 'message', subtype: 'http', extensions: [], description: 'HTTP message', rfc: 'RFC 9110' },
];

// Performance metrics
let totalQueries = 0;
let curatedHits = 0;

/**
 * Find media types by extension
 * @param {string} ext - File extension (with or without leading dot)
 * @returns {MediaTypeEntry[]} Array of matching media types
 */
function findByExtension(ext) {
  const normalized = ext.startsWith('.') ? ext.toLowerCase() : `.${ext.toLowerCase()}`;
  return MEDIA_TYPES.filter(mt => mt.extensions.includes(normalized));
}

/**
 * Find media type by full type string
 * @param {string} typeStr - Full media type (e.g., "text/html")
 * @returns {MediaTypeEntry|null} Matching media type or null if not found
 */
function findByType(typeStr) {
  return MEDIA_TYPES.find(mt => mt.type.toLowerCase() === typeStr.toLowerCase()) || null;
}

/**
 * Search media types by keyword
 * @param {string} query - Search keyword
 * @param {number} [limit] - Maximum results to return
 * @returns {MediaSearchResult} Search results with query metadata
 */
function searchMediaTypes(query, limit = 20) {
  const q = query.toLowerCase();
  const matches = MEDIA_TYPES.filter(mt =>
    mt.type.toLowerCase().includes(q) ||
    mt.description.toLowerCase().includes(q) ||
    mt.subtype.toLowerCase().includes(q) ||
    mt.extensions.some(ext => ext.includes(q))
  );
  
  return {
    query,
    total_found: matches.length,
    returned: Math.min(matches.length, limit),
    results: matches.slice(0, limit)
  };
}

/**
 * Get media types by category
 * @param {string} category - Category name (text, image, audio, video, application, font, multipart, model, message)
 * @param {number} [limit] - Maximum results to return
 * @returns {MediaSearchResult} Media types filtered by category
 */
function getByCategory(category, limit = 20) {
  const matches = MEDIA_TYPES.filter(mt => mt.category.toLowerCase() === category.toLowerCase());
  
  return {
    query: `category:${category}`,
    total_found: matches.length,
    returned: Math.min(matches.length, limit),
    results: matches.slice(0, limit)
  };
}

/**
 * Get database and performance statistics
 * @returns {MediaStatsResult} Database size and performance metrics
 */
function getStats() {
  const byCategory = MEDIA_TYPES.reduce((acc, mt) => {
    acc[mt.category] = (acc[mt.category] || 0) + 1;
    return acc;
  }, {});
  
  const extensionCounts = {};
  MEDIA_TYPES.forEach(mt => {
    mt.extensions.forEach(ext => {
      extensionCounts[ext] = (extensionCounts[ext] || 0) + 1;
    });
  });
  
  const topExtensions = Object.entries(extensionCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([ext]) => ext);
  
  const hitRate = totalQueries > 0 ? ((curatedHits / totalQueries) * 100).toFixed(1) : '0.0';
  
  return {
    total_media_types: MEDIA_TYPES.length,
    by_category: byCategory,
    total_queries: totalQueries,
    curated_hits: curatedHits,
    curated_hit_rate_percent: parseFloat(hitRate),
    top_extensions: topExtensions
  };
}

/**
 * Main MCP server setup
 */
async function main() {
  const server = new McpServer({
    name: 'iana-media-types',
    version: '1.0.0',
  });
  
  // Tool 1: media_by_extension - Look up media type(s) by file extension
  server.tool(
    'media_by_extension',
    'Look up media type(s) by file extension (e.g., .jpg, .json, .mp4)',
    {
      extension: z.string().max(1000).describe('File extension (with or without leading dot, e.g., ".jpg" or "jpg")'),
    },
    async ({ extension }) => {
      totalQueries++;
      const results = findByExtension(extension);
      if (results.length > 0) curatedHits++;
      
      if (results.length === 0) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              extension,
              found: false,
              message: 'No media types found for this extension in curated database.'
            })
          }]
        };
      }
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            extension,
            found: true,
            count: results.length,
            results
          }, null, 2)
        }]
      };
    }
  );
  
  // Tool 2: media_by_type - Look up media type by full type string
  server.tool(
    'media_by_type',
    'Look up media type by full type string (e.g., "text/html", "image/jpeg")',
    {
      type: z.string().max(1000).describe('Media type string (e.g., "application/json", "video/mp4")'),
    },
    async ({ type }) => {
      totalQueries++;
      const result = findByType(type);
      if (result) curatedHits++;
      
      if (!result) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              type,
              found: false,
              message: 'Media type not found in curated database.'
            })
          }]
        };
      }
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            type,
            found: true,
            result
          }, null, 2)
        }]
      };
    }
  );
  
  // Tool 3: media_search - Search media types by keyword
  server.tool(
    'media_search',
    'Search media types by keyword (searches type, description, subtype, extensions)',
    {
      query: z.string().max(1000).describe('Search keyword (e.g., "video", "json", "image")'),
      limit: z.number().optional().describe('Maximum results to return (default: 20)'),
    },
    async ({ query, limit }) => {
      totalQueries++;
      const result = searchMediaTypes(query, limit);
      if (result.total_found > 0) curatedHits++;
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }]
      };
    }
  );
  
  // Tool 4: media_by_category - Get media types by category
  server.tool(
    'media_by_category',
    'Get media types by category (text, image, audio, video, application, font, multipart, model, message)',
    {
      category: z.enum(['text', 'image', 'audio', 'video', 'application', 'font', 'multipart', 'model', 'message'])
        .describe('Media type category'),
      limit: z.number().optional().describe('Maximum results to return (default: 20)'),
    },
    async ({ category, limit }) => {
      totalQueries++;
      const result = getByCategory(category, limit);
      if (result.total_found > 0) curatedHits++;
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }]
      };
    }
  );
  
  // Tool 5: media_stats - Database and performance statistics
  server.tool(
    'media_stats',
    'Get database and performance statistics',
    {},
    async () => {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(getStats(), null, 2)
        }]
      };
    }
  );
  
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
