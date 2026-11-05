import { styled } from "@mui/material/styles";
import { Fragment, useRef, useState, type FC } from "react";
import { PlayControls } from "./PlayControls";
import { RateDisplay } from "./RateDisplay";
import { ButtonGroup, Divider, IconButton, List, ListItem, ListItemButton, ListItemText, Menu, MenuItem } from "@mui/material";
import { useSetter } from "../hooks/state";
import { EditorView } from "../types";
import { Panel, Spacer } from "../styled";
import MenuIcon from "@mui/icons-material/Menu";
import { pickFile, readFile } from "../util/files";
import type { UnityMetadata } from "../../types/unity";
import { translateUnityMetadata } from "../util/unity";

const Aside = styled(Panel)({
    minWidth: 300,
});

const Toolbar = styled(ButtonGroup)(({ theme }) => ({
    padding: theme.spacing(2),
}));

export const MainControls: FC = () => {
    const setView = useSetter("bottomView");
    const setBitmap = useSetter("texture");
    const setSpriteManifest = useSetter("sprites");
    const menuAnchor = useRef<HTMLButtonElement>(null);
    const [ menuOpen, setMenuOpen ] = useState(false);

    const importTextureAtlas = () => {
        setMenuOpen(false);
        pickFile("image/png")
            .then((files) => {
                if (files && files.length === 1) {
                    return createImageBitmap(files[0]!, { colorSpaceConversion: "none" });
                }
            })
            .then((bitmap) => {
                setBitmap(bitmap);
            });
    };

    const importSpriteManifest = () => {
        setMenuOpen(false);
        pickFile("application/json")
            .then((files) => {
                if (files && files.length === 1) {
                    return readFile(files[0]!);
                }
            })
            .then((buffer) => {
                const decoder = new TextDecoder();

                if (buffer) {
                    const text = decoder.decode(buffer);
                    const json = JSON.parse(text) as UnityMetadata;
                    const manifest = translateUnityMetadata(json);
                    setSpriteManifest(manifest);
                }
            });
    };

    return (
        <Fragment>
            <Aside component="aside">
                <Toolbar>
                    <IconButton ref={menuAnchor} onClick={() => setMenuOpen((is) => !is)}>
                        <MenuIcon />
                    </IconButton>
                </Toolbar>
                <Menu anchorEl={menuAnchor.current} open={menuOpen} onClose={() => setMenuOpen(false)}>
                    <MenuItem onClick={importTextureAtlas}>Import texture atlas</MenuItem>
                    <MenuItem onClick={importSpriteManifest}>Import sprite manifest</MenuItem>
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