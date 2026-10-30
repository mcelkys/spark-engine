import { Glob } from "bun";

// 1. Statically declared array of relative file paths
const filePaths: string[] = [
    "AGENTS.md",
    "index.html",
    "assets/sprites.json",
    "assets/animations.json"
];

// 2. Walk the file folder tree starting from folder 'src'
const glob = new Glob("**/*");

for await (const file of glob.scan({ cwd: "src", onlyFiles: true })) {
    filePaths.push(`src/${file.replaceAll("\\", "/")}`);
}

// 3. Read and print each file's path and contents
for (const filePath of filePaths) {
    const file = Bun.file(filePath);

    // Verify the file exists before attempting to read
    if (await file.exists()) {
        const contents = await file.text();

        // Output format: path, blank line, contents, followed by spacing
        console.log(`${filePath}\n\n${contents}\n`);
    } else {
        console.log(`${filePath}\n\n[Notice: File does not exist on disk]\n`);
    }
}