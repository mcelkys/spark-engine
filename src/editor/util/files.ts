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

export function readFile(file: File): Promise<ArrayBuffer> {
    const reader = new FileReader();
    return new Promise((resolve, reject) => {
        reader.addEventListener("load", () => {
            resolve(reader.result as ArrayBuffer);
        }, { passive: true, once: true });
        reader.addEventListener("error", () => {
            reject(reader.error);
        }, { passive: true, once: true });
        reader.readAsArrayBuffer(file);
    });
}