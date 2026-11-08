import { useMemo, useState, type FC } from "react";
import { useSelect } from "../state";
import Button from "@mui/material/Button";
import { FormAction, FormFields, FormHeading, SideForm } from "../styled";
import { useMutation, useSetter } from "../hooks/state";
import TextField from "@mui/material/TextField";
import { handleNumber, handleString } from "../util/input";
import { UnitField } from "../components/UnitField";
import { Combobox } from "../components/Combobox";
import FormControl from "@mui/material/FormControl";
import { InputLabel, Slider } from "@mui/material";

interface SceneViewProps {
    id: number;
}

export const SceneView: FC<SceneViewProps> = ({ id }) => {
    const scene = useSelect((state) => state.game!.scenes.find((scene) => scene.id === id), [id]);
    const audio = useSelect((state) => state.game?.audio ?? []);
    const audioNames = useMemo(() => new Map(audio.map((aud) => [aud.id, aud.name])), [audio]);
    const setView = useSetter("sideView");
    const [name, setName] = useState(scene?.name ?? "");
    const [worldWidth, setWorldWidth] = useState(scene?.worldWidth ?? 0);
    const [worldHeight, setWorldHeight] = useState(scene?.worldHeight ?? 0);
    const [cameraZoom, setCameraZoom] = useState(scene?.cameraZoom ?? 0);
    const [gravity, setGravity] = useState(scene?.gravity ?? 0);
    const [airDensity, setAirDensity] = useState(scene?.airDensity ?? 0);
    const [gridCellSize, setGridCellSize] = useState(scene?.gridCellSize ?? 0);
    const [backgroundAudio, setBackgroundAudio] = useState(scene?.backgroundAudio ?? null);
    const [backgroundAudioVolume, setBackgroundAudioVolume] = useState((scene?.backgroundAudioVolume ?? 1) * 1000);
    const submit = useMutation((state) => ({
        ...state,
        game: {
            ...state.game!,
            scenes: !scene 
                ? [
                    ...(state.game?.scenes ?? []),
                    {
                        id,
                        name,
                        worldWidth,
                        worldHeight,
                        cameraZoom,
                        gravity,
                        airDensity,
                        gridCellSize,
                        backgroundAudio: backgroundAudio ?? undefined,
                        backgroundAudioVolume: backgroundAudioVolume / 1000,
                    },
                ] 
                : (state.game?.scenes ?? []).map((s) => {
                    if (s.id === scene?.id) {
                        return {
                            ...s,
                            name,
                            worldWidth,
                            worldHeight,
                            cameraZoom,
                            gravity,
                            airDensity,
                            gridCellSize,
                            backgroundAudio: backgroundAudio ?? undefined,
                            backgroundAudioVolume: backgroundAudioVolume / 1000,
                        };
                    }
                    return s;
                }),
        },
    }));
    const confirm = () => {
        submit();
        setView(undefined);
    };

    return (
        <SideForm>
            {scene ? (
                <FormHeading variant="h2">{scene?.name}</FormHeading>
            ) : (
                <FormHeading variant="h2">New scene</FormHeading>
            )}
            <FormFields>
                <TextField label="Scene name" value={name} onChange={handleString(setName)} />
                <UnitField label="World width" units="m" type="number" value={worldWidth} onChange={handleNumber(setWorldWidth)} />
                <UnitField label="World height" units="m" type="number" value={worldHeight} onChange={handleNumber(setWorldHeight)} />
                <TextField label="Camera zoom" type="number" value={cameraZoom} onChange={handleNumber(setCameraZoom)} />
                <UnitField
                    label="Gravitational acceleration"
                    units={<>m/s<sup>2</sup></>}
                    type="number"
                    value={gravity}
                    onChange={handleNumber(setGravity)}
                />
                <UnitField
                    label="Density of air"
                    units={<>kg/m<sup>3</sup></>}
                    type="number"
                    value={airDensity}
                    onChange={handleNumber(setAirDensity)}
                />
                <UnitField label="Collision bucket size" units="m" type="number" value={gridCellSize} onChange={handleNumber(setGridCellSize)} />
                <Combobox label="Background audio" value={backgroundAudio} options={audioNames} onChange={setBackgroundAudio} />
                <FormControl>
                    <InputLabel htmlFor="volume" shrink>Background audio volume</InputLabel>
                    <Slider 
                        id="volume" 
                        value={backgroundAudioVolume} 
                        min={0} 
                        max={1000}
                        onChange={(_, val) => setBackgroundAudioVolume(val)}
                        sx={(theme) => ({ marginTop: theme.spacing(2) })}
                    />
                </FormControl>
            </FormFields>
            <FormAction>
                <Button onClick={() => setView(undefined)}>Cancel</Button>
                <Button variant="contained" onClick={confirm}>Save</Button>
            </FormAction>
        </SideForm>
    );
};