export async function loadFile<T>(path: string): Promise<T> {
    const response = await fetch(path);
    return response.json();
}