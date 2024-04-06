import { serve } from "bun";

serve({
  port: 8080,
  async fetch(request) {
    // Determine the requested path
    const url = new URL(request.url);
    const path = url.pathname;

    // Default to serving index.html
    let filePath = "./templates/index.html";
    let contentType = "text/html";

    // Serve engine.js if that's what was requested
    if (path === "/src/main.js") {
      filePath = "./src/main.js";
      contentType = "application/javascript";
    }

    // Read the file content based on the request
    const fileContent = await Bun.file(filePath).text();
    return new Response(fileContent, {
    headers: { "Content-Type": contentType },
    
    }) 
  },
});

console.log(`Server running at http://localhost:8080/`);
