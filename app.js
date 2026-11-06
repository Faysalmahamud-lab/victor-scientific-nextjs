import { createServer } from "node:http";

async function startServer() {
  try {
    const { default: next } = await import("next");

    const port = Number(
      process.env.PORT || process.env.NODE_PORT || 3000
    );

    const hostname = "0.0.0.0";

    const app = next({
      dev: false,
      hostname,
      port,
    });

    await app.prepare();

    const handle = app.getRequestHandler();

    const server = createServer((req, res) => {
      Promise.resolve()
        .then(() => handle(req, res))
        .catch((error) => {
          console.error("Next.js request failed:", error);

          if (!res.headersSent) {
            res.statusCode = 500;
            res.end("Internal Server Error");
          } else {
            res.destroy(error);
          }
        });
    });

    server.on("error", (error) => {
      console.error("Next.js server error:", error);
      process.exit(1);
    });

    server.listen(port, hostname, () => {
      console.log(
        `Victor Scientific Next.js running on port ${port}`
      );
    });

  } catch (error) {
    console.error("Next.js startup failed:", error);
    process.exit(1);
  }
}

startServer();
