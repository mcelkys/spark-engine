export function Singleton<C extends { new(): {} }>(cls: C): void {
    new cls();
}