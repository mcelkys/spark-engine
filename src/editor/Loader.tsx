import { Fragment, useEffect, type FC, type PropsWithChildren } from "react";
import { useSelect } from "./state";
import { GameRenderer } from "../game-renderer";
import { loadFile } from "../util/util";
import type { Game } from "../types/game";
import type { AnimationPack, SpriteMetadata } from "../types/assets";
import { Renderer } from "../render/renderer";
import { useSetter } from "./hooks/state";
import { Box, CircularProgress, type BoxProps } from "@mui/material";
import { styled } from "@mui/material/styles";



interface LoaderProps extends PropsWithChildren {
    url: string;
}

const Fullscreen = styled(Box)<BoxProps>({
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
});

export const Loader: FC<LoaderProps> = ({ url, children }) => {
    const state = useSelect((state) => state);
    const setDevice = useSetter("device");
    const setGame = useSetter("game");
    const setSprites = useSetter("sprites");
    const setAnimationPack = useSetter("animationPack");
    const setTexture = useSetter("texture");
    const game = state.game;


    useEffect(() => {
        Promise.all([GameRenderer.requestDevice(), loadFile<Game>(url)])
            .then(([ device, game ]) => {
                setDevice(device);
                setGame(game);
            });
    }, [url]);

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

    return (
        <Fullscreen>
            <CircularProgress size={100} />
        </Fullscreen>
    );
};