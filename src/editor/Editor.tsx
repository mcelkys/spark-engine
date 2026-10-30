import type { FC } from "react";
import { ThemeProvider } from '@mui/material/styles';
import { GameView } from "./bridge/GameView";
import { MainControls } from "./controls/MainControls";
import { EditorProvider } from "./state";
import { Loader } from "./Loader";
import { BottomViewSelector } from "./views/BottomViewSelector";
import { SideViewSelector } from "./views/SideViewSelector";
import { StyleBaseline } from "./StyleBaseline";
import { THEME } from "./theme";
import { StructuralColumn, StructuralRow } from "./styled";

export const Editor: FC = () => (
    <EditorProvider>
        <ThemeProvider theme={THEME}>
            <StyleBaseline />
            <Loader url="/assets/game.json">
                <MainControls />
                <StructuralRow>
                    <StructuralColumn component="main">
                        <GameView />
                        <BottomViewSelector />
                    </StructuralColumn>
                    <SideViewSelector />
                </StructuralRow>
            </Loader>
        </ThemeProvider>
    </EditorProvider>
);