import { Button, FormControl, InputLabel, MenuItem, Select, TextField } from "@mui/material";
import { useState, type FC } from "react";
import { useSelect } from "../state";
import { useMutation, useSetter } from "../hooks/state";
import { BottomForm, FormAction, FormFields, FormHeading } from "../styled";
import { handleNumber, handleString } from "../util/input";

export const GlobalsView: FC = () => {
    const game = useSelect((state) => state.game);
    const setView = useSetter("bottomView");
    const [ name, setName ] = useState(game?.name ?? "");
    const [ assetManifest, setAssetManifest ] = useState(game?.assetManifest ?? "");
    const [ spriteManifest, setSpriteManifest ] = useState(game?.spriteManifest ?? "");
    const [ textureAtlas, setTextureAtlas ] = useState(game?.textureAtlas ?? "");
    const [ maxEntities, setMaxEntities ] = useState(game?.maxEntities ?? 0);
    const [ maxTemplates, setMaxTemplates ] = useState(game?.maxTemplates ?? 0);
    const [ scene, setScene ] = useState(game?.scene ?? 0);
    const submit = useMutation((state) => ({
        ...state,
        game: {
            ...state.game!,
            name,
            maxEntities,
            maxTemplates,
            assetManifest,
            spriteManifest,
            textureAtlas,
            scene,
        },
    }));
    const confirm = () => {
        submit();
        setView(undefined);
    };

    return (
        <BottomForm>
            <FormHeading variant="h2">Global game settings</FormHeading>
            <FormFields>
                <TextField label="Game name" value={name} onChange={handleString(setName)} />
                <FormControl>
                    <InputLabel id="initial-scene-label">Initial scene</InputLabel>
                    <Select labelId="initial-scene-label" label="Initial scene" value={scene} onChange={(event) => setScene(event.target.value)}>
                        {game?.scenes.map((scene) => (
                            <MenuItem key={scene.id} value={scene.id}>{scene.name}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <TextField type="number" label="Maximum number of entities" value={maxEntities} onChange={handleNumber(setMaxEntities)} />
                <TextField type="number" label="Maximum number of templates" value={maxTemplates} onChange={handleNumber(setMaxTemplates)} />
                <TextField label="Asset manifest file" value={assetManifest} onChange={handleString(setAssetManifest)} />
                <TextField label="Sprite manifest file" value={spriteManifest} onChange={handleString(setSpriteManifest)} />
                <TextField label="Texture atlas file" value={textureAtlas} onChange={handleString(setTextureAtlas)} />
            </FormFields>
            <FormAction>
                <Button onClick={() => setView(undefined)}>Cancel</Button>
                <Button variant="contained" onClick={confirm}>Confirm</Button>
            </FormAction>
        </BottomForm>
    );
};