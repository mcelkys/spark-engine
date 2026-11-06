import { Fragment, useEffect, type FC, type PropsWithChildren } from "react";
import { useSelect } from "./state";
import { GameRenderer } from "../game-renderer";
import { loadFile } from "../util/util";
import type { Game } from "../types/game";
import type { AnimationPack, SpriteMetadata } from "../types/assets";
import { Renderer } from "../render/renderer";
import { useSetter } from "./hooks/state";
import { Box, Button, CircularProgress, type BoxProps } from "@mui/material";
import { styled } from "@mui/material/styles";
import { pickFile, readFile } from "./util/files";

const Fullscreen = styled(Box)<BoxProps>({
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
});

export const Loader: FC<PropsWithChildren> = ({ children }) => {
    const state = useSelect((state) => state);
    const setDevice = useSetter("device");
    const setGame = useSetter("game");
    const setSprites = useSetter("sprites");
    const setAnimationPack = useSetter("animationPack");
    const setTexture = useSetter("texture");
    const game = state.game;

    useEffect(() => {
        GameRenderer.requestDevice()
            .then((device) => setDevice(device));
    }, []);

    useEffect(() => {
        if (game?.animationPack) {
            loadFile<AnimationPack>(game.animationPack)
                .then((animations) => setAnimationPack(animations));
        }
    }, [game?.animationPack]);

    useEffect(() => {
        if (game?.spriteManifest) {
            loadFile<SpriteMetadata>(game.spriteManifest)
                .then((sprites) => setSprites(sprites));
        }
    }, [game?.spriteManifest]);

    useEffect(() => {
        if (game?.textureAtlas) {
            Renderer.loadBitmap(game.textureAtlas)
                .then((texture) => setTexture(texture));
        }
    }, [game?.textureAtlas]);

    if (state.device && state.game && state.sprites && state.animationPack && state.texture) {
        return (
            <Fragment>{children}</Fragment>
        );
    }

    return game 
        ? (
            <Fullscreen>
                <CircularProgress size={100} />
            </Fullscreen>
        )
        : (
            <Fullscreen>
                <Button size="large" variant="contained" onClick={async () => {
                    const decoder = new TextDecoder();
                    const file = await pickFile("game-file", { "application/json": ".json" });
                    const buffer = await readFile(file);
                    const text = decoder.decode(buffer);
                    const project = JSON.parse(text) as Game;
                    setGame(project);
                }}>
                    Open project
                </Button>
            </Fullscreen>
        );
};