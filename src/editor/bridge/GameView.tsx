import Box, { type BoxProps } from "@mui/material/Box";
import { useEffect, useRef, type FC } from "react";
import { Engine } from "../../engine";
import { styled } from "@mui/material/styles";
import { useSelect } from "../state";
import { TextureAtlas } from "../../textures";
import { useMutation, useSetter } from "../hooks/state";

const Section = styled(Box)<BoxProps>(({ theme }) => ({
    ...theme.shape,
    flex: 1,
    overflow: "hidden",
    maxWidth: "100%",
    minWidth: 0,
    boxSizing: "border-box",
}));

export const GameView: FC = () => {
    const container = useRef<HTMLElement>(null);
    const canvas = useRef<HTMLCanvasElement>(null);
    const state = useSelect((state) => state);
    const setEngine = useSetter("engine");
    const setLoadedSceneId = useSetter("loadedSceneId");

    useEffect(() => {
        if (canvas.current instanceof HTMLCanvasElement && !state.engine) {
            const atlas = new TextureAtlas(state.sprites!, state.animationPack!.animations, state.animationPack!.collections);
            const engine = new Engine(state.game!, state.device!, canvas.current, state.texture!, atlas);

            Object.defineProperty(window, "engine", {
                value: engine,
            })

            engine.initialize()
                .then(() => engine.start())
                .then(() => {
                    setEngine(engine);
                    setLoadedSceneId(engine.scene.id);
                });
        }
    }, [canvas.current, state]);

    useEffect(() => {
        const element = container.current;
        const engine = state.engine;

        if (element instanceof HTMLElement && engine instanceof Engine) {
            const observer = new ResizeObserver(() => {
                engine.renderer.setScreenSize(element.clientWidth, element.clientHeight);
            });
            observer.observe(element);
            return () => observer.disconnect();
        }
    }, [container, state.engine]);

    useReboot();

    return (
        <Section ref={container} component="section">
            <canvas ref={canvas} onClick={(event) => {
                if (state.engine instanceof Engine && state.game) {
                    const worldPoint = state.engine.translateToWorldSpace({
                        x: event.nativeEvent.offsetX,
                        y: event.nativeEvent.offsetY,
                    });
                    const entityIds = state.engine.entityManager.findEntitiesAt(worldPoint);
                    const entities = state.game.entities.filter((entity) => entityIds.includes(entity.id));
                    console.log(entities);
                }
            }}></canvas>
        </Section>
    );
};

function useReboot(): void {
    const state = useSelect((state) => state);
    const clearChanged = useMutation((state) => ({ ...state, changedEntities: undefined }));
    const { engine, game } = state;

    useEffect(() => {
        if (engine instanceof Engine && game) {
            engine.gameName = game.name;
        }
    }, [game?.name]);

    useEffect(() => {
        if (engine instanceof Engine && game) {
            engine.stop()
                .then(() => engine.resizeBuffer(game.maxEntities, game.maxTemplates))
                .then(() => engine.start());
        }
    }, [game?.maxEntities, game?.maxTemplates]);

    useEffect(() => {
        if (engine instanceof Engine && state.animationPack && state.sprites && state.texture) {
            const { animationPack, sprites, texture } = state;
            engine.stop()
                .then(() => {
                    const atlas = new TextureAtlas(sprites, animationPack.animations, animationPack.collections);
                    return engine.reassignTexture(texture, atlas);
                })
                .then(() => engine.start());
        }
    }, [state.animationPack, state.sprites, state.texture]);

    useEffect(() => {
        if (engine instanceof Engine && Array.isArray(game?.scenes)) {
            engine.reassignScenes(game.scenes);
        }
    }, [game?.scenes]);

    useEffect(() => {
        if (engine instanceof Engine && typeof state.loadedSceneId === "number") {
            engine.entityManager.unloadScene()
                .then(() => engine.loadScene(state.loadedSceneId!));
        }
    }, [state.loadedSceneId]);

    useEffect(() => {
        if (engine instanceof Engine && Array.isArray(game?.templates)) {
            engine.stop()
                .then(() => engine.entityManager.reassignTemplates(game.templates))
                .then(() => engine.start());
        }
    }, [game?.templates]);

    useEffect(() => {
        if (engine instanceof Engine && Array.isArray(game?.entities)) {
            engine.entityManager.reassignEntities(game.entities, state.changedEntities);
            clearChanged();
        }
    }, [game?.entities]);

    useEffect(() => {
        if (engine instanceof Engine) {
            engine.input.setBindings(game?.keyBindings ?? {});
            clearChanged();
        }
    }, [game?.keyBindings]);
}