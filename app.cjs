const http = require("node:http");

async function startServer() {
  const { default: next } = await import("next");

  const port = Number(
    process.env.PORT || process.env.NODE_PORT || 3000
  );

  const hostname = "0.0.0.0";

  const app = next({
    dev: false,
    hostname,
    port
  });

  await app.prepare();

  const handle = app.getRequestHandler();

  const server = http.createServer((req, res) => {
    handle(req, res);
  });

  server.listen(port, hostname, () => {
    console.log(
      `Victor Scientific running on port ${port}`
    );
  });
}

startServer().catch((error) => {
  console.error("Application startup failed:", error);
  process.exit(1);
});
