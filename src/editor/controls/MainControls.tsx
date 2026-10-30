import { styled } from "@mui/material/styles";
import type { FC } from "react";
import { useSelect } from "../state";
import { PlayControls } from "./PlayControls";
import { RateDisplay } from "./RateDisplay";
import { Divider, List, ListItem, ListItemButton, ListItemText } from "@mui/material";
import { useSetter } from "../hooks/state";
import { EditorView } from "../types";
import { H4, Panel, Spacer } from "../styled";

const Aside = styled(Panel)({
    minWidth: 300,
});

const Title = styled(H4)(({ theme }) => ({
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(2),
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2),
}));

export const MainControls: FC = () => {
    const game = useSelect((state) => state.game!);
    const setView = useSetter("bottomView");

    return (
        <Aside component="aside">
            <Title variant="h1">{game.name}</Title>
            <Divider variant="middle" />
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
            </List>
            
            <Spacer />
            <PlayControls />
            <Divider variant="middle" />
            <RateDisplay />
        </Aside>
    );
};