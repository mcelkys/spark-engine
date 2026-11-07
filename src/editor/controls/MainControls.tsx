import { styled } from "@mui/material/styles";
import { Fragment, useRef, useState, type FC } from "react";
import { PlayControls } from "./PlayControls";
import { RateDisplay } from "./RateDisplay";
import { ButtonGroup, Divider, IconButton, List, ListItem, ListItemButton, ListItemText, Menu, MenuItem } from "@mui/material";
import { useFlagSetter, useSetter } from "../hooks/state";
import { EditorView } from "../types";
import { Panel, Spacer } from "../styled";
import SaveIcon from "@mui/icons-material/Save";
import HandymanIcon from "@mui/icons-material/Handyman";
import { pickFile, readFile, saveFile } from "../util/files";
import type { UnityMetadata } from "../../types/unity";
import { translateUnityMetadata } from "../util/unity";
import { useSelect } from "../state";

const Aside = styled(Panel)({
    minWidth: 300,
});

const Toolbar = styled(ButtonGroup)(({ theme }) => ({
    padding: theme.spacing(2),
    gap: theme.spacing(1),
}));

export const MainControls: FC = () => {
    const state = useSelect((state) => state);
    const setView = useSetter("bottomView");
    const setBitmap = useSetter("texture");
    const setSpriteManifest = useSetter("sprites");
    const setSelectingEntity = useFlagSetter("selectingEntity");
    const setMovingEntity = useFlagSetter("movingEngity");
    const fileAnchor = useRef<HTMLButtonElement>(null);
    const toolAnchor = useRef<HTMLButtonElement>(null);
    const [ fileMenuOpen, setFileMenuOpen ] = useState(false);
    const [ toolMenuOpen, setToolMenuOpen ] = useState(false);

    const importTextureAtlas = async () => {
        setFileMenuOpen(false);
        const file = await pickFile("texture-atlas", { "image/png": ".png" });
        const bitmap = await createImageBitmap(file, { colorSpaceConversion: "none" });
        setBitmap(bitmap);
    };

    const importSpriteManifest = async () => {
        setFileMenuOpen(false);
        const decoder = new TextDecoder();
        const file = await pickFile("sprite-manifest", { "application/json": ".json" });
        const buffer = await readFile(file);
        const text = decoder.decode(buffer);
        const json = JSON.parse(text) as UnityMetadata;
        const manifest = translateUnityMetadata(json);
        setSpriteManifest(manifest);
    };

    const exportGameFile = async () => {
        const encoder = new TextEncoder();
        const text = JSON.stringify(state.game);
        const data = encoder.encode(text);
        await saveFile("game-file", { "application/json": ".json" }, data);
    };

    const exportSpriteMetadata = async () => {
        const encoder = new TextEncoder();
        const text = JSON.stringify(state.sprites);
        const data = encoder.encode(text);
        await saveFile("game-file", { "application/json": ".json" }, data);
    };

    const exportAnimationPack = async () => {
        const encoder = new TextEncoder();
        const text = JSON.stringify(state.animationPack);
        const data = encoder.encode(text);
        await saveFile("game-file", { "application/json": ".json" }, data);
    };

    return (
        <Fragment>
            <Aside component="aside">
                <Toolbar>
                    <IconButton ref={fileAnchor} onClick={() => setFileMenuOpen((is) => !is)}>
                        <SaveIcon />
                    </IconButton>
                    <IconButton ref={toolAnchor} onClick={() => setToolMenuOpen((is) => !is)}>
                        <HandymanIcon />
                    </IconButton>
                </Toolbar>
                <Menu anchorEl={fileAnchor.current} open={fileMenuOpen} onClose={() => setFileMenuOpen(false)}>
                    <MenuItem onClick={importTextureAtlas}>Import texture atlas</MenuItem>
                    <MenuItem onClick={importSpriteManifest}>Import sprite manifest</MenuItem>
                    <MenuItem onClick={exportGameFile}>Export game file</MenuItem>
                    <MenuItem onClick={exportSpriteMetadata}>Export sprite metadata</MenuItem>
                    <MenuItem onClick={exportAnimationPack}>Export animation pack</MenuItem>
                </Menu>
                <Menu anchorEl={toolAnchor.current} open={toolMenuOpen} onClose={() => setToolMenuOpen(false)}>
                    <MenuItem onClick={() => {
                        setToolMenuOpen(false);
                        setSelectingEntity(true);
                    }}>Select entity</MenuItem>
                    <MenuItem onClick={() => {
                        setToolMenuOpen(false);
                        setMovingEntity(true);
                    }}>Move entity</MenuItem>
                </Menu>
                <List>
                    <ListItem disablePadding>
                        <ListItemButton onClick={() => setView(EditorView.GLOBALS)}>
                            <ListItemText primary="Globals" />
                        </ListItemButton>
                    </ListItem>
                    <ListItem disablePadding>
                        <ListItemButton onClick={() => setView(EditorView.KEY_BINDINGS)}>
                            <ListItemText primary="Key bindings" />
                        </ListItemButton>
                    </ListItem>
                    <ListItem disablePadding>
                        <ListItemButton onClick={() => setView(EditorView.SCENES)}>
                            <ListItemText primary="Scenes" />
                        </ListItemButton>
                    </ListItem>
                    <ListItem disablePadding>
                        <ListItemButton onClick={() => setView(EditorView.TEMPLATES)}>
                            <ListItemText primary="Templates" />
                        </ListItemButton>
                    </ListItem>
                    <ListItem disablePadding>
                        <ListItemButton onClick={() => setView(EditorView.ENTITIES)}>
                            <ListItemText primary="Entities" />
                        </ListItemButton>
                    </ListItem>
                    <ListItem disablePadding>
                        <ListItemButton onClick={() => setView(EditorView.ANIMATIONS)}>
                            <ListItemText primary="Animations" />
                        </ListItemButton>
                    </ListItem>
                    <ListItem disablePadding>
                        <ListItemButton onClick={() => setView(EditorView.ANIMATION_COLLECTIONS)}>
                            <ListItemText primary="Animation collections" />
                        </ListItemButton>
                    </ListItem>
                </List>
                <Spacer />
                <PlayControls />
                <Divider variant="middle" />
                <RateDisplay />
            </Aside>
        </Fragment>
    );
};