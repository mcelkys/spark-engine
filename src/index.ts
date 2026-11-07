import { Engine } from "./engine";
import { Renderer } from "./render/renderer";

const canvas = Renderer.findCanvas("gpu-canvas");
const engine = await Engine.start(canvas, "/assets/game.json");

window.addEventListener("resize", () => {
	engine.renderer.setScreenSize(document.body.clientWidth, document.body.clientHeight);
}, { passive: true });


// declare const deltaTime: number; // supplied by physics engine tick

// declare const gravity: number; // part of scene
// declare const airDensity: number; // part of scene

// declare const friction: number; // part of template
// declare const mass: number; // part of template
// declare const hitboxScaleX: number; // part of template
// declare const hitboxScaleY: number; // part of template
// declare const dragCoefficient: number; // part of template

// declare const force: number; // part of entity
// declare const forceAngle: number; // part of entity
// declare let velocity: number; // part of entity
// declare let velocityAngle: number; // part of entity
// declare let x: number; // part of entity
// declare let y: number; // part of entity


// const forceX = force * Math.cos(forceAngle);
// const forceY = force * Math.sin(forceAngle);
// let resistiveForce = 0.0;
// const resistiveForceAngle = velocityAngle + Math.PI;

// if (velocity > 0.0) {
// 	const surfaceArea = hitboxScaleX * hitboxScaleY;
// 	const dragForce = 0.5 * dragCoefficient * airDensity * surfaceArea * velocity ** 2;
// 	const frictionForce = friction * mass * gravity;
// 	resistiveForce = frictionForce + dragForce;
// }

// const resistiveForceX = resistiveForce * Math.cos(resistiveForceAngle);
// const resistiveForceY = resistiveForce * Math.sin(resistiveForceAngle);
// const netForceX = forceX + resistiveForceX;
// const netForceY = forceY + resistiveForceY;
// const netForce = Math.sqrt(netForceX ** 2 + netForceY ** 2);
// const netForceAngle = Math.atan2(netForceY, netForceX);

// const acceleration = netForce / mass;

// if (velocity > 0.0) {
// 	const headingDelta = netForceAngle - velocityAngle;
// 	const accelerationParallel = acceleration * Math.cos(headingDelta);
// 	const deltaVelocity = accelerationParallel * deltaTime;
// 	velocity = Math.max(0, velocity + deltaVelocity);

// 	if (velocity > 0.0) {
// 		const accelerationPerpendicular = acceleration * Math.sin(headingDelta);
// 		const angularVelocity = accelerationPerpendicular / velocity;
// 		velocityAngle = velocityAngle + angularVelocity * deltaTime;
// 	}
// } else {
// 	const deltaVelocity = acceleration * deltaTime;
// 	velocity = Math.max(0, velocity + deltaVelocity);

// 	if (velocity > 0.0) {
// 		velocityAngle = netForceAngle;
// 	}
// }

// const headingDelta = netForceAngle - velocityAngle;
// const accelerationParallel = acceleration * Math.cos(headingDelta);
// const deltaVelocity = accelerationParallel * deltaTime;
// velocity = Math.max(0, velocity + deltaVelocity);

// if (velocity > 0) {
// 	const accelerationPerpendicular = acceleration * Math.sin(headingDelta);
// 	const angularVelocity = accelerationPerpendicular / velocity;
// 	velocityAngle = velocityAngle + angularVelocity * deltaTime;
// } else {
// 	velocityAngle = netForceAngle;
// }

// const deltaX = velocity * Math.cos(velocityAngle) * deltaTime;
// const deltaY = velocity * Math.sin(velocityAngle) * deltaTime;
// x = x + deltaX;
// y = y + deltaY;