import * as http from "node:http";
import * as path from "node:path";
import * as fs from "fs/promises";

const HOSTNAME = "127.0.0.1";
const PORT = 8081;

const server = http.createServer(async (req, res) => {
  try {
    await handleRequest(req, res);
  } catch (error) {
    console.error(`Error serving ${req.url}`);
    console.error(error);
    res.statusCode = 500;
    res.end("Internal Server Error");
  }
});

async function handleRequest(req, res) {
  // Handle mock API endpoints for server commands
  if (req.url.startsWith("/test/")) {
    return handleTestEndpoint(req, res);
  }
  
  // Serve htmx.js from node_modules
  if (req.url === "/node_modules/htmx.org/dist/htmx.js") {
    return serveHtmxJs(req, res);
  }
  
  // Serve server-commands.js
  if (req.url === "/server-commands.js") {
    return serveServerCommandsJs(req, res);
  }
  
  // Serve static files from manual-tests directory
  try {
    await serveStaticFile(req, res);
  } catch (error) {
    res.statusCode = 404;
    res.end("Not Found");
  }
}

function handleTestEndpoint(req, res) {
  res.setHeader("Content-Type", "text/html");
  
  const url = req.url;
  
  // Mock responses for different test endpoints
  if (url === "/test/swap") {
    res.end('<htmx target="#target" swap="outerHTML"><div id="target">Swapped content! ' + new Date().toLocaleTimeString() + '</div></htmx>');
  } else if (url === "/test/inner-html") {
    res.end('<htmx target="#swap-target" swap="innerHTML">Inner content updated! ' + new Date().toLocaleTimeString() + '</htmx>');
  } else if (url === "/test/outer-html") {
    res.end('<htmx target="#swap-target" swap="outerHTML"><div id="swap-target">Outer content replaced! ' + new Date().toLocaleTimeString() + '</div></htmx>');
  } else if (url === "/test/trigger") {
    res.end('<htmx trigger="testEvent,customEvent"></htmx>');
  } else if (url === "/test/trigger-json") {
    res.end('<htmx trigger="{\"customEventWithData\": {\"message\": \"Hello from server!\"}}"></htmx>');
  } else if (url === "/test/redirect") {
    res.end('<htmx redirect="/redirected-page"></htmx>');
  } else if (url === "/test/refresh") {
    res.end('<htmx refresh="true"></htmx>');
  } else if (url === "/test/location") {
    res.end('<htmx location="/new-location"></htmx>');
  } else if (url === "/test/push-url") {
    res.end('<htmx push-url="/new-path"></htmx>');
  } else if (url === "/test/replace-url") {
    res.end('<htmx replace-url="/replaced-path"></htmx>');
  } else if (url === "/test/multiple") {
    res.end(
      '<htmx target="#target1" swap="outerHTML"><div id="target1">Updated Target 1</div></htmx>' +
      '<htmx target="#target2" swap="innerHTML">Updated Target 2 content</htmx>' +
      '<htmx trigger="multiCommandComplete"></htmx>'
    );
  } else if (url === "/test/timing") {
    res.end(
      '<htmx target="#timing-target" swap="outerHTML"><div id="timing-target">Content updated</div></htmx>' +
      '<htmx trigger-after-swap="afterSwapEvent"></htmx>' +
      '<htmx trigger-after-settle="afterSettleEvent"></htmx>'
    );
  } else if (url === "/test/error") {
    res.end('<htmx target="#nonexistent" swap="outerHTML"><div>This should error</div></htmx>');
  } else if (url === "/test/invalid") {
    res.end('<htmx unknown-attr="value">Invalid command</htmx>');
  } else {
    res.statusCode = 404;
    res.end("Test endpoint not found");
  }
}

async function serveHtmxJs(req, res) {
  try {
    const htmxPath = path.join(process.cwd(), "node_modules", "htmx.org", "dist", "htmx.js");
    const content = await fs.readFile(htmxPath);
    res.setHeader("Content-Type", "text/javascript");
    res.end(content);
  } catch (error) {
    res.statusCode = 404;
    res.end("htmx.js not found");
  }
}

async function serveServerCommandsJs(req, res) {
  try {
    const extensionPath = path.join(process.cwd(), "server-commands.js");
    const content = await fs.readFile(extensionPath);
    res.setHeader("Content-Type", "text/javascript");
    res.end(content);
  } catch (error) {
    res.statusCode = 404;
    res.end("server-commands.js not found");
  }
}

async function serveStaticFile(req, res) {
  let filePath = req.url === "/" ? "/manual-tests/index.html" : req.url;
  
  // Remove query parameters
  filePath = filePath.split('?')[0];
  
  const fullPath = path.join(process.cwd(), filePath);
  
  try {
    const content = await fs.readFile(fullPath);
    
    // Set appropriate content type
    if (filePath.endsWith('.html')) {
      res.setHeader("Content-Type", "text/html");
    } else if (filePath.endsWith('.js')) {
      res.setHeader("Content-Type", "text/javascript");
    } else if (filePath.endsWith('.css')) {
      res.setHeader("Content-Type", "text/css");
    }
    
    res.end(content);
  } catch (error) {
    throw new Error("File not found");
  }
}

server.listen(PORT, HOSTNAME, () => {
  console.log("Server Commands Manual Test Server running at:");
  console.log(`http://${HOSTNAME}:${PORT}/`);
  console.log("\nAvailable test pages:");
  console.log("  • http://localhost:8081/manual-tests/basic-swap.html");
  console.log("  • http://localhost:8081/manual-tests/commands.html");
  console.log("  • http://localhost:8081/manual-tests/complex-scenarios.html");
});