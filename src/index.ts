import { Engine } from "./engine";
import { Renderer } from "./render/renderer";

const canvas = Renderer.findCanvas("gpu-canvas");
const engine = await Engine.start(canvas, "/assets/game.json");

window.addEventListener("resize", () => {
	engine.renderer.setScreenSize(document.body.clientWidth, document.body.clientHeight);
}, { passive: true });