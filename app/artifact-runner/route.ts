import type { NextRequest } from "next/server";

const RUNNER_HTML = String.raw`<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta
      http-equiv="Content-Security-Policy"
      content="default-src 'self'; script-src 'self' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; connect-src 'self';"
    />
    <script src="/js/browser@4.js"></script>

    <style>
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        background: #fff;
        color: #0f172a;
      }
      #root {
        min-height: 100vh;
        width: 100%;
      }
      .artifact-error {
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
        background: #fee2e2;
        color: #b91c1c;
        margin: 0;
        padding: 16px;
        white-space: pre-wrap;
      }
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script src="/js/recharts-bundle.js"></script>
    <script src="/js/babel.min.js"></script>
    <script src="/artifact-runner/runner.js"></script>
  </body>
</html>`;

export function GET(_request: NextRequest) {
  return new Response(RUNNER_HTML, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=600",
    },
  });
}


