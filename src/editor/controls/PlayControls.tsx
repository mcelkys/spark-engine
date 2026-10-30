import IconButton from "@mui/material/IconButton";
import Box from "@mui/material/Box";
import { useEffect, useState, type FC } from "react";
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import { styled } from "@mui/material/styles";
import { useSelect } from "../state";

const Container = styled(Box)(({ theme }) => ({
    display: "flex",
    justifyContent: "center",
    paddingTop: theme.spacing(2),
    paddingRight: theme.spacing(1),
    paddingBottom: theme.spacing(2),
    paddingLeft: theme.spacing(1),
}));

export const PlayControls: FC = () => {
    const engine = useSelect((state) => state.engine);
    const [ playing, setPlaying ] = useState(true);

    useEffect(() => {
        if (engine) {
            engine.buffer.isRunning = playing;
        }
    }, [engine, playing]);

    return (
        <Container>
            <IconButton size="large" onClick={() => setPlaying(!playing)}>
                {playing ? <PauseIcon fontSize="inherit" /> : <PlayArrowIcon fontSize="inherit" />}
            </IconButton>
        </Container>
    );
};