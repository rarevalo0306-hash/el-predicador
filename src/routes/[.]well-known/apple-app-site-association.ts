import { createFileRoute } from "@tanstack/react-router";

/**
 * Universal Links: shared passage links (/?leer=…) open in the iPhone app when
 * it is installed. Only those links; sign-in callbacks and the rest stay web.
 */
const ASSOCIATION = {
  applinks: {
    details: [
      {
        appIDs: ["7687NAN4DQ.app.thepreacher.ios"],
        components: [{ "/": "/", "?": { leer: "?*" }, comment: "Shared passage" }],
      },
    ],
  },
};

export const Route = createFileRoute("/.well-known/apple-app-site-association")({
  server: {
    handlers: {
      GET: () =>
        Response.json(ASSOCIATION, {
          headers: { "cache-control": "public, max-age=3600" },
        }),
    },
  },
});
