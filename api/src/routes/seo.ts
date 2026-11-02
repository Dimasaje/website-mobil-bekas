import { Hono } from "hono";
import {
  collectSitemapEntries,
  renderRobots,
  renderSitemap,
} from "../seo/sitemap";
import { siteOrigin } from "./site";

export const seoRouter = new Hono();

seoRouter.get("/robots.txt", (c) => {
  c.header("Content-Type", "text/plain; charset=utf-8");
  c.header("Cache-Control", "public, max-age=3600");
  return c.body(renderRobots(siteOrigin()));
});

seoRouter.get("/sitemap.xml", async (c) => {
  const entries = await collectSitemapEntries(siteOrigin());
  c.header("Content-Type", "application/xml; charset=utf-8");
  c.header("Cache-Control", "public, max-age=600");
  return c.body(renderSitemap(entries));
});
