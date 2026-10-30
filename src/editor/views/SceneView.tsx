import { useState, type FC } from "react";
import { useSelect } from "../state";
import Button from "@mui/material/Button";
import { FormAction, FormFields, FormHeading, SideForm } from "../styled";
import { useMutation, useSetter } from "../hooks/state";
import TextField from "@mui/material/TextField";
import { handleNumber, handleString } from "../util/input";
import { UnitField } from "../components/UnitField";

interface SceneViewProps {
    id: number;
}

export const SceneView: FC<SceneViewProps> = ({ id }) => {
    const scene = useSelect((state) => state.game!.scenes.find((scene) => scene.id === id), [id]);
    const setView = useSetter("sideView");
    const [name, setName] = useState(scene?.name ?? "");
    const [worldWidth, setWorldWidth] = useState(scene?.worldWidth ?? 0);
    const [worldHeight, setWorldHeight] = useState(scene?.worldHeight ?? 0);
    const [cameraZoom, setCameraZoom] = useState(scene?.cameraZoom ?? 0);
    const [gravity, setGravity] = useState(scene?.gravity ?? 0);
    const [airDensity, setAirDensity] = useState(scene?.airDensity ?? 0);
    const [gridCellSize, setGridCellSize] = useState(scene?.gridCellSize ?? 0);
    const submit = useMutation((state) => ({
        ...state,
        game: {
            ...state.game!,
            scenes: (state.game?.scenes ?? []).map((s) => {
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
            <FormHeading variant="h2">{scene?.name}</FormHeading>
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
            </FormFields>
            <FormAction>
                <Button onClick={() => setView(undefined)}>Cancel</Button>
                <Button variant="contained" onClick={confirm}>Save</Button>
            </FormAction>
        </SideForm>
    );
};