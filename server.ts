Bun.serve({
  port: 3000,
  async fetch(req) {
    const url = new URL(req.url);
    let pathname = url.pathname;

    // 1. PAGE ROUTING
    if (pathname === "/") {
      pathname = "/index.html";
    } else if (pathname === "/editor") {
      pathname = "/editor.html";
    }

    // 2. BUNDLING & COMPILATION PIPELINE
    // Catches requests for script tags (ends with .ts, .tsx, or generated .js files)
    if (pathname.endsWith(".ts") || pathname.endsWith(".tsx") || pathname.endsWith(".js")) {
      let tsPath = "." + pathname;
      
      // If index.html requests /src/main.js, map it to /src/main.ts
      if (pathname.endsWith(".js")) {
        tsPath = "." + pathname.replace(/\.js$/, ".ts");
      }

      let file = Bun.file(tsPath);

      // Fallback: If the .ts file doesn't exist, check if it's an editor React .tsx file
      if (!(await file.exists()) && tsPath.endsWith(".ts")) {
        tsPath = tsPath + "x"; // Appends 'x' to make it .tsx
        file = Bun.file(tsPath);
      }

      if (await file.exists()) {
        const result = await Bun.build({
          entrypoints: [tsPath],
          target: "browser",
          format: "esm",
          sourcemap: "inline",
        });

        if (result.success) {
          const code = await result.outputs[0]!.text();
          return new Response(code, {
            headers: {
              "Content-Type": "application/javascript",
              "Cross-Origin-Opener-Policy": "same-origin",
              "Cross-Origin-Embedder-Policy": "require-corp",
            },
          });
        }
      }
    }

    // 3. STATIC FILES
    // Handles index.html, editor.html, standard CSS, shaders, images, etc.
    const filePath = `.${pathname}`;
    const file = Bun.file(filePath);

    if (await file.exists()) {
      return new Response(file, {
        headers: {
          "Cross-Origin-Opener-Policy": "same-origin",
          "Cross-Origin-Embedder-Policy": "require-corp",
        },
      });
    }

    return new Response("Not Found", { status: 404 });
  },
});

console.log("Server running at http://localhost:3000/");
