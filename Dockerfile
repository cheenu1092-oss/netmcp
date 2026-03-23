# NetMCP — Docker image for all 9 networking MCP servers
# Usage: docker run -it netmcp [package-name]
# Example: docker run -it netmcp oui-lookup

FROM node:24-alpine

# Install whois command (required by whois-lookup package)
RUN apk add --no-cache whois

# Set working directory
WORKDIR /app

# Copy package files for dependency installation
# Root package.json first (contains workspaces config)
COPY package.json package-lock.json ./

# Create packages directory structure and copy package.json files
RUN mkdir -p packages/oui-lookup packages/rfc-search packages/nvd-network-cves packages/fcc-devices packages/threegpp-specs packages/iana-services packages/dns-records packages/iana-media-types packages/whois-lookup
COPY packages/oui-lookup/package*.json ./packages/oui-lookup/
COPY packages/rfc-search/package*.json ./packages/rfc-search/
COPY packages/nvd-network-cves/package*.json ./packages/nvd-network-cves/
COPY packages/fcc-devices/package*.json ./packages/fcc-devices/
COPY packages/threegpp-specs/package*.json ./packages/threegpp-specs/
COPY packages/iana-services/package*.json ./packages/iana-services/
COPY packages/dns-records/package*.json ./packages/dns-records/
COPY packages/iana-media-types/package*.json ./packages/iana-media-types/
COPY packages/whois-lookup/package*.json ./packages/whois-lookup/

# Install dependencies (npm workspaces)
RUN npm ci --omit=dev

# Copy source code
COPY packages/ ./packages/

# Copy README and documentation
COPY README.md GETTING_STARTED.md CHANGELOG.md LICENSE ./

# Set default package (can be overridden with docker run argument)
ENV NETMCP_PACKAGE=oui-lookup

# Entrypoint script to run specified package
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]

# Default: run oui-lookup server
CMD ["oui-lookup"]

# Metadata
LABEL org.opencontainers.image.title="NetMCP"
LABEL org.opencontainers.image.description="Networking intelligence MCP servers for AI agents"
LABEL org.opencontainers.image.url="https://github.com/cheenu1092-oss/netmcp"
LABEL org.opencontainers.image.documentation="https://github.com/cheenu1092-oss/netmcp#readme"
LABEL org.opencontainers.image.source="https://github.com/cheenu1092-oss/netmcp"
LABEL org.opencontainers.image.licenses="MIT"
LABEL org.opencontainers.image.authors="Nagarjun Srinivasan <naga22694+clawd@gmail.com>"
