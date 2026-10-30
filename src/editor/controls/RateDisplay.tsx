import { List, ListItem, ListItemText, styled, type ListItemProps, type ListProps, type TypographyProps } from "@mui/material";
import { useEffect, useState, type FC } from "react";
import { useSelect } from "../state";

const HorizontalList = styled(List)<ListProps>(({ theme }) => ({
    ...theme.shape,
    display: "flex",
    marginRight: theme.spacing(1),
    marginLeft: theme.spacing(1),
    justifyContent: "space-evenly",
}));

const Item = styled(ListItem)<ListItemProps>(() => ({
    flex: 0,
}));

export const RateDisplay: FC = () => {
    const [ fps, setFps ] = useState(0);
    const [ ptps, setPtps ] = useState(0);
    const [ speed, setSpeed ] = useState(0);
    const engine = useSelect((state) => state.engine);

    useEffect(() => {
        const interval = setInterval(() => {
            if (engine) {
                const playerId = engine.buffer.playerId;
                setFps(engine.buffer.fps);
                setPtps(engine.buffer.physicsRate);
                if (playerId >= 0) {
                    setSpeed(engine.buffer.velocity[playerId]! * 2.23694);
                }
            }
        }, 50);
        return () => clearInterval(interval);
    }, [engine]);

    return (
        <HorizontalList>
            <Item disablePadding>
                <ListItemText primary={fps.toFixed(0)} secondary="fps" />
            </Item>
            <Item disablePadding>
                <ListItemText primary={ptps.toFixed(0)} secondary="pps" />
            </Item>
            <Item disablePadding>
                <ListItemText primary={speed.toFixed(2).padStart(5, "0")} secondary="mph" />
            </Item>
        </HorizontalList>
    );
};