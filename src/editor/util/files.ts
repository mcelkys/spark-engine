export function pickFile(accept?: string, multiple = false): Promise<FileList | null> {
    const input = document.createElement("input");
    input.type = "file";

    if (typeof accept === "string") {
            input.accept = accept;
    }

    input.multiple = multiple;

    return new Promise((resolve) => {
        input.addEventListener("change", () => {
            resolve(input.files);
        }, { passive: true, once: true });
        input.click();
    });
}