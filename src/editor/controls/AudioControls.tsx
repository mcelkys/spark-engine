import Box from "@mui/material/Box";
import { styled } from "@mui/material/styles";
import { useEffect, useMemo, useState, type FC } from "react";
import { useSelect } from "../state";
import IconButton from "@mui/material/IconButton";
import VolumeOff from "@mui/icons-material/VolumeOff";
import VolumeUp from "@mui/icons-material/VolumeUp";
import VolumeDown from "@mui/icons-material/VolumeDown";
import Slider from "@mui/material/Slider";

const Container = styled(Box)(({ theme }) => ({
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    paddingTop: theme.spacing(1),
    paddingRight: theme.spacing(3),
    paddingBottom: theme.spacing(1),
    paddingLeft: theme.spacing(2),
    gap: theme.spacing(2),
}));

export const AudioControls: FC = () => {
    const engine = useSelect((state) => state.engine);
    const [ volume, setVolumn ] = useState(1000);
    const [ mute, setMute ] = useState(false);
    const gain = useMemo(() => mute ? 0.0 : volume / 1000, [mute, volume]);

    useEffect(() => {
        if (engine) {
            engine.audioManager.gain = gain;
        }
    }, [engine, gain]);

    return (
        <Container>
            <IconButton size="medium" onClick={() => setMute(!mute)}>
                {
                    gain === 0 
                        ? <VolumeOff fontSize="inherit" />
                        : gain > 0.5 
                            ? <VolumeUp fontSize="inherit" /> 
                            : <VolumeDown fontSize="inherit" />
                }
            </IconButton>
            <Slider disabled={mute} value={volume} onChange={(_, val) => setVolumn(val)} min={0} max={1000} />
        </Container>
    );
};