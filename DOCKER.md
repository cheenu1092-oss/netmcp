# Docker Deployment Guide

NetMCP provides Docker support for easy deployment of all 9 networking MCP servers.

## Quick Start

### Option 1: Docker Run (Single Server)

```bash
# Build the image
docker build -t netmcp:latest .

# Run a specific server (oui-lookup example)
docker run -it netmcp:latest oui-lookup

# Run a different server
docker run -it netmcp:latest rfc-search
```

### Option 2: Docker Compose (Multi-Server)

```bash
# Start all 9 servers
docker-compose up

# Start a specific server
docker-compose up oui-lookup

# Start multiple servers
docker-compose up oui-lookup rfc-search nvd-network-cves

# Run in background (detached)
docker-compose up -d

# View logs
docker-compose logs -f oui-lookup

# Stop all servers
docker-compose down
```

## Available Services

Each MCP server runs as a separate Docker service:

| Service | Package | Container Name |
|---------|---------|----------------|
| `oui-lookup` | IEEE OUI database | `netmcp-oui-lookup` |
| `rfc-search` | IETF RFC search | `netmcp-rfc-search` |
| `nvd-network-cves` | NIST NVD CVEs | `netmcp-nvd-network-cves` |
| `fcc-devices` | FCC equipment | `netmcp-fcc-devices` |
| `threegpp-specs` | 3GPP specifications | `netmcp-threegpp-specs` |
| `iana-services` | IANA ports/protocols | `netmcp-iana-services` |
| `dns-records` | DNS record types | `netmcp-dns-records` |
| `iana-media-types` | MIME types | `netmcp-iana-media-types` |
| `whois-lookup` | WHOIS queries | `netmcp-whois-lookup` |

## MCP Client Configuration

### Using Docker with MCP Clients

Most MCP clients support stdio transport via Docker. Example configurations:

#### Claude Code

```json
{
  "mcpServers": {
    "netmcp-oui": {
      "command": "docker",
      "args": ["run", "-i", "--rm", "netmcp:latest", "oui-lookup"]
    },
    "netmcp-rfc": {
      "command": "docker",
      "args": ["run", "-i", "--rm", "netmcp:latest", "rfc-search"]
    }
  }
}
```

#### Cursor/Windsurf

```json
{
  "mcpServers": {
    "netmcp-oui": {
      "command": "docker",
      "args": ["run", "-i", "--rm", "netmcp:latest", "oui-lookup"]
    }
  }
}
```

#### OpenClaw

```yaml
agents:
  main:
    model: anthropic/claude-sonnet-4-5
    mcp:
      oui-lookup:
        command: docker
        args:
          - run
          - -i
          - --rm
          - netmcp:latest
          - oui-lookup
```

**Important:** Use `--rm` flag to auto-remove containers after use (prevents container buildup).

## Image Details

### Base Image

- **Base:** `node:24-alpine` (official Node.js on Alpine Linux)
- **Size:** ~150MB (compressed)
- **Includes:** Node.js 24.x + whois command (for whois-lookup package)

### Installed Packages

All 9 NetMCP packages with production dependencies only (no dev dependencies).

### Entrypoint

The Docker entrypoint (`docker-entrypoint.sh`) validates the requested package and starts the MCP server in stdio mode.

## Building from Source

```bash
# Clone the repository
git clone https://github.com/cheenu1092-oss/netmcp.git
cd netmcp

# Build the image
docker build -t netmcp:latest .

# Verify the build
docker run -it netmcp:latest oui-lookup
```

## Production Deployment

### Docker Swarm

```bash
# Initialize swarm (if not already)
docker swarm init

# Deploy the stack
docker stack deploy -c docker-compose.yml netmcp

# List services
docker service ls

# Scale a service
docker service scale netmcp_oui-lookup=3
```

### Kubernetes

Example Deployment manifest (oui-lookup):

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: netmcp-oui-lookup
spec:
  replicas: 2
  selector:
    matchLabels:
      app: netmcp-oui-lookup
  template:
    metadata:
      labels:
        app: netmcp-oui-lookup
    spec:
      containers:
      - name: oui-lookup
        image: netmcp:latest
        args: ["oui-lookup"]
        stdin: true
        tty: true
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "500m"
```

### Health Checks

Since MCP servers use stdio transport, traditional HTTP health checks don't apply. Consider:

1. **Liveness:** Check if container process is running
2. **Readiness:** Test with a simple MCP query via stdin/stdout
3. **Monitoring:** Use `docker logs` or log aggregation (Splunk, ELK, etc.)

## Troubleshooting

### Container Exits Immediately

MCP servers expect stdin/stdout communication. Always use:
- Docker: `-it` flags (interactive + TTY)
- Docker Compose: `stdin_open: true` and `tty: true`

### Package Not Found Error

```
❌ Error: Package 'xyz' not found
```

**Solution:** Use one of the 9 valid package names (see table above).

### WHOIS Not Working

The `whois` command requires Alpine package `whois`, which is included in the Dockerfile. If removed, reinstall:

```dockerfile
RUN apk add --no-cache whois
```

### Build Fails

**Common causes:**
1. **npm install fails:** Check internet connection, npm registry availability
2. **Missing files:** Ensure all packages/ directories exist
3. **Docker version:** Requires Docker 20.10+ for BuildKit features

## Performance Considerations

### Resource Limits

Default Docker Compose configuration has no resource limits. For production:

```yaml
services:
  oui-lookup:
    # ... other config ...
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 256M
        reservations:
          cpus: '0.1'
          memory: 128M
```

### Caching

- **OUI database:** Cached in Docker image (4.3MB, rarely changes)
- **NVD CVEs:** In-memory cache (24hr TTL, not persisted across restarts)
- **Other packages:** No caching (API-based or curated databases)

To persist NVD cache across restarts, mount a volume (future enhancement).

### Rate Limiting

Rate limiters are per-container. For high-volume deployments:
- Scale horizontally (multiple containers)
- Implement shared rate limiting (Redis, etc.) if needed

## Security

### Running as Non-Root

The default image runs as root. For production, create a non-root user:

```dockerfile
# Add to Dockerfile
RUN addgroup -g 1001 netmcp && adduser -D -u 1001 -G netmcp netmcp
USER netmcp
```

### Read-Only Filesystem

Most packages don't write to disk. Enable read-only filesystem:

```yaml
services:
  oui-lookup:
    # ... other config ...
    read_only: true
    tmpfs:
      - /tmp
```

**Exception:** `oui-lookup` may need write access if OUI database updates are enabled.

## License

MIT License — see [LICENSE](LICENSE) for details.

---

**Need help?** Open an issue at https://github.com/cheenu1092-oss/netmcp/issues
