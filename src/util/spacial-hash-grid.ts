export class SpacialHashGrid {
    public readonly selected: SpacialHashRegion;
    public readonly cells: SpacialHashCell[];
    private readonly worldWidth: number;
    private readonly worldHeight: number;
    private readonly cellSize: number;
    private readonly columns: number;
    private readonly rows: number;

    constructor(worldWidth: number, worldHeight: number, cellSize: number, capacity: number) {
        this.worldWidth = worldWidth;
        this.worldHeight = worldHeight;
        this.cellSize = cellSize;
        this.columns = Math.ceil(worldWidth / cellSize);
        this.rows = Math.ceil(worldHeight / cellSize);
        this.cells = [];

        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.columns; c++) {
                const cell = new SpacialHashCell(capacity);
                this.cells.push(cell);
            }
        }

        this.selected = new SpacialHashRegion(this.cells.length);
    }

    public clear(): void {
        for (const cell of this.cells) {
            cell.clear();
        }
    }

    public insert(id: number, x: number, y: number, width: number, height: number): void {
        const worldX = this.worldWidth / 2 + x;
        const worldY = this.worldHeight / 2 + y;
        const halfWidth = width / 2;
        const halfHeight = height / 2;
        const minCol = Math.max(0, Math.floor((worldX - halfWidth) / this.cellSize));
        const maxCol = Math.min(this.columns - 1, Math.floor((worldX + halfWidth) / this.cellSize));
        const minRow = Math.max(0, Math.floor((worldY - halfHeight) / this.cellSize));
        const maxRow = Math.min(this.rows -1, Math.floor((worldY + halfHeight) / this.cellSize));

        for (let row = minRow; row <= maxRow; row++) {
            for (let column = minCol; column <= maxCol; column++) {
                const cellId = row * this.columns + column;
                const cell = this.cells[cellId]!;
                cell.insert(id);
            }
        }
    }

    public select(x: number, y: number, width: number, height: number): void {
        const worldX = this.worldWidth / 2 + x;
        const worldY = this.worldHeight / 2 + y;
        const halfWidth = width / 2;
        const halfHeight = height / 2;
        const minCol = Math.max(0, Math.floor((worldX - halfWidth) / this.cellSize));
        const maxCol = Math.min(this.columns - 1, Math.floor((worldX + halfWidth) / this.cellSize));
        const minRow = Math.max(0, Math.floor((worldY - halfHeight) / this.cellSize));
        const maxRow = Math.min(this.rows -1, Math.floor((worldY + halfHeight) / this.cellSize));

        this.selected.clear();

        for (let row = minRow; row <= maxRow; row++) {
            for (let column = minCol; column <= maxCol; column++) {
                const cellId = row * this.columns + column;
                this.selected.insert(cellId);
            }
        }
    }

}

class SpacialHashCell {
    public readonly ids: Uint32Array;
    public count: number;

    constructor(capacity: number) {
        this.ids = new Uint32Array(capacity);
        this.count = 0;
    }

    public clear(): void {
        this.count = 0;
    }

    public insert(id: number): void {
        const idx = this.count;
        this.ids[idx] = id;
        this.count = idx + 1;
    }
}

class SpacialHashRegion {
    public readonly cells: Uint32Array;
    public count: number;

    constructor(capacity: number) {
        this.cells = new Uint32Array(capacity);
        this.count = 0;
    }

    public clear(): void {
        this.count = 0;
    }

    public insert(id: number): void {
        const idx = this.count;
        this.cells[idx] = id;
        this.count = idx + 1;
    }
}
