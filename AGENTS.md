# Project Guidelines & Architecture (`AGENTS.md`)

Welcome to the **High-Performance WebGPU Engine** repository. This project is a multi-threaded, GPU-accelerated 2D rendering and simulation engine engineered from the ground up for extreme **performance, unlocked framerates, and absolute zero allocations (0 GC pressure)** in hot loops.

---

## 🏗️ Core Architecture & Performance Principles

### 1. Concurrency & Unlocked Framerates
* **Decoupled Simulation & Rendering:** The engine completely separates the physics/update loop from the display refresh rate. 
* **Web Worker (`src/worker.ts`)**: Runs an independent, unlocked high-frequency simulation tick loop using zero-delay scheduling (`setTimeout(tick, 0)`). This ensures physics and game logic run at maximum possible CPU frequency, entirely free from standard V-Sync or `requestAnimationFrame` display bottlenecks.
* **Main Thread (`src/index.ts`)**: Dedicated strictly to GPU synchronization and command encoding, ensuring maximum rendering throughput.

### 2. Strict Zero-Allocation Policy (0 GC Pressure)
* **Zero Runtime Garbage Collection:** To eliminate micro-stutters and frame drops caused by garbage collection pauses, **all memory is pre-allocated upfront** at initialization.
* **Pre-Allocated Pools & Buffers:** Entity structures, typed array views (`Float32Array`, `Int32Array`), and the underlying `SharedArrayBuffer` are allocated once. Hot execution loops (physics updates, memory writes, and rendering passes) contain **zero `new` statements, object creations, or array resizings**. Data is mutated in-place.

### 3. Zero-Copy Shared Memory & Bandwidth Optimization
* Avoids message-passing serialization overhead by sharing memory directly via a single `SharedArrayBuffer`.
* **Layout Structure:**
  * **Metadata Header (`Int32Array`)**: Slot 0 stores the current active entity count (published atomically via `Atomics.store` by the worker, read via `Atomics.load` on the main thread).
  * **Payload Data (`Float32Array`)**: Fixed-capacity direct-mapped snapshot buffer sized for up to 4,096 quads.
* **Selective Bus Transfer:** The main thread minimizes PCIe bandwidth consumption by uploading *only* the active subset of bytes per frame using `queue.writeBuffer(..., 0, buffer, metadataBytes, activeBytes)`.

### 4. Coordinate Systems & Camera Uniforms
* **World Space vs. Clip Space:** Physics and game logic operate in natural virtual world units (e.g., `-50` to `50`). 
* **GPU-Accelerated Transformation:** NDC mapping ([-1 to 1]) and aspect ratio corrections are computed dynamically on window resize and uploaded as a lightweight `16-byte` uniform block, offloading transformation overhead entirely to the GPU vertex pipeline.

---

## 🛠️ Code Conventions & Patterns

1. **Zero-Allocation Hot Loops:** Never instantiate objects, arrays, or temporary wrappers inside `tick()` or render frame callbacks. Reuse pre-allocated arrays and index pointers.
2. **Fluent Builders:** Use descriptive builder patterns (e.g., `VertexBufferDescriptor.create("label").withStride(...)...`) for pipeline and buffer setup.
3. **Explicit Byte Strides & Alignments:** Strictly align WebGPU uniforms and vertex attributes to 16-byte boundaries to comply with hardware layout requirements.
4. **Strict TypeScript:** Avoid `any`. Explicitly type all shared memory views and communication structures.
5. **Shader Modularity:** Keep WGSL shaders lean and declarative. Use module-scope `const` blocks for static geometry lookup tables to eliminate per-invocation overhead.

---

## 🚀 Key Rules for Modifying Code

* **When adding entity attributes:** Update `ELEMENT_SIZE` in `src/const.ts`, modify vertex attribute formats in `VertexBufferDescriptor`, and update matching layout locations (`@location(...)`) in `vertex.wgsl`.
* **When modifying loops:** Ensure any newly added simulation logic adheres strictly to the **zero-allocation** rule (mutate existing pre-allocated data structures in place).
* **When modifying camera/projection:** Ensure uniform buffer byte size (16 bytes) and 16-byte alignment rules are strictly preserved.