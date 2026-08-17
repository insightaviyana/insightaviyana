<?xml version="1.0" encoding="UTF-8"?>
<!--
  Makes the RSS feed render as a readable page when someone opens
  /rss.xml directly in a browser, instead of showing raw XML source
  (the default behavior in Chrome/Edge on Windows -- reported as a real
  issue). Actual RSS reader apps ignore this file entirely and just
  parse the XML normally; it's purely a browser-viewing convenience.
-->
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="html" encoding="UTF-8" indent="yes"/>
  <xsl:template match="/">
    <html lang="en">
      <head>
        <meta charset="UTF-8"/>
        <title><xsl:value-of select="/rss/channel/title"/></title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #020617;
            color: #e2e8f0;
            max-width: 720px;
            margin: 0 auto;
            padding: 32px 20px 64px;
            line-height: 1.6;
          }
          .banner {
            background: #1e293b;
            border: 1px solid rgba(245, 158, 11, 0.3);
            border-radius: 12px;
            padding: 16px 20px;
            margin-bottom: 32px;
            font-size: 13px;
            color: #94a3b8;
          }
          .banner strong { color: #fbbf24; }
          h1 { font-size: 26px; margin-bottom: 4px; color: #ffffff; }
          .description { color: #94a3b8; margin-bottom: 32px; }
          .item {
            border-bottom: 1px solid #1e293b;
            padding: 20px 0;
          }
          .item:last-child { border-bottom: none; }
          .item-title {
            font-size: 17px;
            font-weight: 700;
            margin: 0 0 6px;
          }
          .item-title a { color: #fbbf24; text-decoration: none; }
          .item-title a:hover { text-decoration: underline; }
          .item-meta {
            font-size: 12px;
            color: #64748b;
            font-family: monospace;
            margin-bottom: 8px;
          }
          .item-desc { color: #cbd5e1; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="banner">
          This is an <strong>RSS feed</strong>. Copy this page's URL into an RSS reader
          (Feedly, Inoreader, etc.) to subscribe, or browse the latest entries below.
        </div>
        <h1><xsl:value-of select="/rss/channel/title"/></h1>
        <p class="description"><xsl:value-of select="/rss/channel/description"/></p>
        <xsl:for-each select="/rss/channel/item">
          <div class="item">
            <div class="item-title">
              <a href="{link}"><xsl:value-of select="title"/></a>
            </div>
            <div class="item-meta">
              <xsl:value-of select="category"/> &#8226; <xsl:value-of select="pubDate"/>
            </div>
            <div class="item-desc"><xsl:value-of select="description"/></div>
          </div>
        </xsl:for-each>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
