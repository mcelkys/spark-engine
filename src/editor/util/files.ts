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

export async function pickFile(id: string, accept: Record<MIMEType, FileExtension | FileExtension[]>): Promise<File> {
    const [ handle ] = await window.showOpenFilePicker({
        id,
        multiple: false,
        excludeAcceptAllOption: true,
        types: [
            { accept },
        ],
    });
    return handle.getFile();
}

export async function saveFile(id: string, accept: Record<MIMEType, FileExtension | FileExtension[]>, data: FileSystemWriteChunkType): Promise<void> {
    const handle = await window.showSaveFilePicker({
        id,
        excludeAcceptAllOption: true,
        types: [
            { accept },
        ],
    });
    const stream = await handle.createWritable();
    await stream.write(data);
    await stream.close();
}