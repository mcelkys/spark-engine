import { Fragment, useMemo, useState, type FC } from "react";
import Button from "@mui/material/Button";
import { FormAction, FormFields, FormHead, H5, SideForm } from "../styled";
import { useSelect } from "../state";
import { useMutation, useSetter } from "../hooks/state";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import { UnitField } from "../components/UnitField";
import { handleNumber } from "../util/input";
import { Hide } from "../components/Hide";
import { Trait } from "../../types/entity";
import { Combobox } from "../components/Combobox";

interface EntityViewProps {
    id: number;
}

export const EntityView: FC<EntityViewProps> = ({ id }) => {
    const scenes = useSelect((state) => state.game?.scenes ?? []);
    const templates = useSelect((state) => state.game?.templates ?? []);
    const entity = useSelect((state) => state.game!.entities.find((entity) => entity.id === id), [id]);
    const setView = useSetter("sideView");
    const [isPlayer, setPlayer] = useState(entity?.isPlayer ?? false);
    const [sceneId, setSceneId] = useState(entity?.scene ?? null);
    const [templateId, setTemplateId] = useState(entity?.template ?? null);
    const [x, setX] = useState(entity?.x ?? 0);
    const [y, setY] = useState(entity?.y ?? 0);
    const [velocity, setVelocity] = useState(entity?.velocity ?? 0);
    const [angle, setAngle] = useState(entity?.angle ?? 0);
    const [force, setForce] = useState(entity?.force ?? 0);
    const sceneOptions = useMemo(() => new Map(scenes.map((scene) => [scene.id, scene.name])), [scenes]);
    const templateOptions = useMemo(() => new Map(templates.map((template) => [template.id, template.name])), [templates]);
    const template = useMemo(() => templates.find((template) => template.id === templateId), [templateId, templates]);
    const submit = useMutation((state) => ({
        ...state,
        game: {
            ...state.game!,
            entities: !entity
                ? [
                    ...(state.game?.entities ?? []),
                    {
                        id,
                        isPlayer,
                        x,
                        y,
                        velocity,
                        angle,
                        force,
                        scene: sceneId ?? -1,
                        template: templateId ?? -1,
                        asset: "rock",
                    }
                ]
                : (state.game?.entities ?? []).map((ent) => {
                    if (ent.id === id) {
                        return {
                            ...ent,
                            isPlayer,
                            x,
                            y,
                            velocity,
                            angle,
                            force,
                            scene: sceneId ?? -1,
                            template: templateId ?? -1,
                        };
                    }
                    return isPlayer ? { ...ent, isPlayer: false } : ent;
                }),
        },
        changedEntities: entity ? new Set([id]) : new Set(),
    }));
    const confirm = () => {
        submit();
        setView(undefined);
    };

    return (
        <Fragment>
            <SideForm>
                <FormHead>
                    {!entity ? (
                        <H5 variant="h2">New entity</H5>
                    ) : (
                        <H5 variant="h2">{template?.name} #{entity?.id}</H5>
                    )}
                    <FormControlLabel label="Player" control={<Switch checked={isPlayer} onChange={(event) => setPlayer(event.target.checked)} />} />
                </FormHead>
                <FormFields>
                    <Combobox label="Appears in scene" value={sceneId} options={sceneOptions} onChange={setSceneId} />
                    <Combobox label="Template" value={templateId} options={templateOptions} onChange={setTemplateId} />
                    <UnitField label="Spawn X coordinate" units="m" type="number" value={x} onChange={handleNumber(setX)} />
                    <UnitField label="Spawn Y coordinate" units="m" type="number" value={y} onChange={handleNumber(setY)} />
                    <Hide show={template?.traits.includes(Trait.MOBILE)}>
                        <UnitField label="Spawn with inital velocity" units="m/s" type="number" value={velocity} onChange={handleNumber(setVelocity)} />
                        <UnitField label="Spawn with initial movement angle" units="rad" type="number" value={angle} onChange={handleNumber(setAngle)} />
                        <UnitField label="Spawn with initial movement force" units="N" type="number" value={force} onChange={handleNumber(setForce)} />
                    </Hide>
                </FormFields>
                <FormAction>
                    <Button onClick={() => setView(undefined)}>Cancel</Button>
                    <Button variant="contained" onClick={confirm}>Save</Button>
                </FormAction>
            </SideForm>
        </Fragment>
    );
};