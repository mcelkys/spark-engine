import Box, { type BoxProps } from "@mui/material/Box";
import { useEffect, useRef, useState, type FC, type MouseEventHandler } from "react";
import { Engine } from "../../engine";
import { styled } from "@mui/material/styles";
import { useSelect } from "../state";
import { TextureAtlas } from "../../textures";
import { useFlagSetter, useMutation, useSetter } from "../hooks/state";
import { SideViewType, type EditorState } from "../types";
import type { Point } from "../../types/util";
import type { Entity } from "../../types/game";

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
    const setSelectingEntity = useFlagSetter("selectingEntity");
    const setMovingEntity = useFlagSetter("movingEngity");
    const setPointListener = useFlagSetter("pointListener");
    const setSideView = useSetter("sideView");
    const setEntityPosition = useMutation<[number, number, number]>((state, id, x, y) => ({
        ...state,
        game: {
            ...state.game!,
            entities: (state.game?.entities ?? []).map((entity) => {
                if (entity.id === id) {
                    return { ...entity, x, y };
                }
                return entity;
            }),
        },
    }));
    const flags = state.flags;

    const [draggedEntityId, setDraggedEntityId] = useState<number>();

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

    const selectEntity: MouseEventHandler<HTMLCanvasElement> = (event) => {
        const entity = findEntity(state, {
            x: event.nativeEvent.offsetX,
            y: event.nativeEvent.offsetY,
        });

        if (entity) {
            setSideView({
                type: SideViewType.ENTITY,
                id: entity.id,
            });
        }

        setSelectingEntity(false);
    };

    const startDragging: MouseEventHandler<HTMLCanvasElement> = (event) => {
        const entity = findEntity(state, {
            x: event.nativeEvent.offsetX,
            y: event.nativeEvent.offsetY,
        });

        if (entity) {
            setDraggedEntityId(entity.id);
        }
    };

    const dragEntity: MouseEventHandler<HTMLCanvasElement> = (event) => {
        if (state.engine instanceof Engine && state.game && typeof draggedEntityId === "number") {
            const worldPoint = state.engine.translateToWorldSpace({
                x: event.nativeEvent.offsetX,
                y: event.nativeEvent.offsetY,
            });
            const entityId = state.engine.entityManager.getEntityId(draggedEntityId)!;
            state.engine.buffer.x[entityId] = worldPoint.x;
            state.engine.buffer.y[entityId] = worldPoint.y;
        }
    };

    const stopDragging: MouseEventHandler<HTMLCanvasElement> = (event) => {
        if (state.engine instanceof Engine && typeof draggedEntityId === "number") {
            const worldPoint = state.engine.translateToWorldSpace({
                x: event.nativeEvent.offsetX,
                y: event.nativeEvent.offsetY,
            });
            setEntityPosition(draggedEntityId, worldPoint.x, worldPoint.y);
        }
        setDraggedEntityId(undefined);
        setMovingEntity(false);
    };

    const findPoint: MouseEventHandler<HTMLCanvasElement> = (event) => {
        if (state.engine instanceof Engine && typeof flags.pointListener === "function") {
            const worldPoint = state.engine.translateToWorldSpace({
                x: event.nativeEvent.offsetX,
                y: event.nativeEvent.offsetY,
            });
            flags.pointListener(worldPoint);
        }
        setPointListener(undefined);
    };

    return (
        <Section ref={container} component="section">
            <canvas
                ref={canvas}
                onClick={
                    typeof flags.pointListener === "function"
                        ? findPoint
                        : flags.selectingEntity 
                            ? selectEntity 
                            : undefined
                }
                onMouseDown={flags.movingEngity ? startDragging : undefined}
                onMouseMove={typeof draggedEntityId === "number" ? dragEntity : undefined}
                onMouseUp={typeof draggedEntityId === "number" ? stopDragging : undefined}
                style={{
                    cursor: typeof flags.pointListener === "function"
                        ? "crosshair"
                        : typeof draggedEntityId === "number" 
                            ? "grabbing"
                            : flags.movingEngity 
                                ? "grab"
                                : flags.selectingEntity 
                                    ? "pointer" 
                                    : "unset",
                }}
            ></canvas>
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

function findEntity(state: EditorState, point: Point): Entity | undefined {
    if (state.engine instanceof Engine && state.game) {
        const worldPoint = state.engine.translateToWorldSpace(point);
        const entityIds = state.engine.entityManager.findEntitiesAt(worldPoint);
        const entities = state.game.entities.filter((entity) => entityIds.includes(entity.id));

        entities.sort((a, b) => {
            const templateA = state.game?.templates.find((template) => template.id === a.template);
            const templateB = state.game?.templates.find((template) => template.id === b.template);
            const areaA = (templateA?.scaleX ?? 0) * (templateA?.scaleY ?? 0);
            const areaB = (templateB?.scaleX ?? 0) * (templateB?.scaleY ?? 0);
            return areaA - areaB;
        });

        return entities[0];
    }

    return undefined;
}