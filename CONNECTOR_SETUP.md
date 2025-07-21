# Connector Setup Guide

This guide will help you set up the real API connectors for your knowledge base.

## Environment Variables

Add the following environment variables to your `.env.local` file:

### Notion Connector
```bash
NOTION_CLIENT_ID=your_notion_client_id
NOTION_CLIENT_SECRET=your_notion_client_secret
NOTION_REDIRECT_URI=http://localhost:3000/knowledge/connectors/notion/setup
```

To get these credentials:
1. Go to https://www.notion.so/my-integrations
2. Click "New integration"
3. Fill in your integration details
4. Copy the Client ID and Client Secret

### Google Drive Connector
```bash
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/knowledge/connectors/google-drive/setup
```

To get these credentials:
1. Go to https://console.cloud.google.com/
2. Create a new project or select existing one
3. Enable the Google Drive API
4. Go to "Credentials" and create an OAuth 2.0 Client ID
5. Add your redirect URI
6. Copy the Client ID and Client Secret

### GitHub Connector
```bash
# No server-side config needed - uses personal access tokens
```

Users need to create a personal access token at https://github.com/settings/tokens/new with these scopes:
- `repo` (for private repos) or `public_repo` (for public repos only)
- `read:user`

### Web Crawler
```bash
# No server-side config needed - all configuration is done in the UI
```

## Setup Instructions

1. **Copy environment variables**: Copy the variables above to your `.env.local` file and fill in your actual credentials.

2. **Restart your development server**: After adding environment variables, restart your Next.js development server.

3. **Test connectors**: Visit `/knowledge/connectors` and try connecting each service.

## API Endpoints

The following API endpoints have been implemented:

### Notion
- `GET/POST /api/connectors/notion/auth` - OAuth2 authentication
- `GET /api/connectors/notion/pages` - Fetch pages and databases
- `POST /api/connectors/notion/sync` - Sync selected pages

### Google Drive  
- `GET/POST /api/connectors/google-drive/auth` - OAuth2 authentication
- `GET /api/connectors/google-drive/files` - Browse files
- `POST /api/connectors/google-drive/sync` - Sync selected files

### GitHub
- `POST /api/connectors/github/sync` - Sync repository documentation

### Web Crawler
- `POST /api/connectors/web-crawler/sync` - Crawl and index websites

## Features Implemented

✅ **Notion Connector**
- Full OAuth2 authentication flow
- Workspace and database discovery
- Page content extraction with rich text parsing
- Block-level content processing

✅ **Google Drive Connector**
- OAuth2 authentication with refresh tokens
- File browsing with type filtering
- Content export for Google Docs, Slides, and text files
- Metadata extraction

✅ **GitHub Connector**
- Personal access token authentication
- Repository documentation discovery
- README, Wiki, and docs folder processing
- Branch selection support

✅ **Web Crawler**
- Configurable depth and page limits
- Domain restrictions and URL filtering
- Robots.txt compliance
- Rate limiting and politeness

## Next Steps

1. **Set up API credentials** for each service you want to use
2. **Test the connectors** by visiting the setup pages
3. **Configure automatic syncing** (future enhancement)
4. **Add more connectors** as needed (Slack, Confluence, etc.)

All connectors integrate with the existing `DocumentIngestionPipeline` to ensure consistent processing and storage of imported content.
