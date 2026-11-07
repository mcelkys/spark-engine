import { Fragment, useMemo, useState, type FC } from "react";
import Button from "@mui/material/Button";
import Box, { type BoxProps } from "@mui/material/Box";
import { FormAction, FormFields, FormHead, H5, SideForm } from "../styled";
import { useSelect } from "../state";
import { useFlagSetter, useMutation, useSetter } from "../hooks/state";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import { UnitField } from "../components/UnitField";
import { handleNumber } from "../util/input";
import { Hide } from "../components/Hide";
import { Trait } from "../../types/entity";
import { Combobox } from "../components/Combobox";
import { styled } from "@mui/material/styles";
import IconButton from "@mui/material/IconButton";
import { MyLocation } from "@mui/icons-material";

interface EntityViewProps {
    id: number;
}

const FieldCollection = styled(Box)<BoxProps>(({ theme }) => ({
    display: "flex",
    gap: theme.spacing(3),
}));

const FieldSet = styled(FormFields)<BoxProps>(({ theme }) => ({
    flex: 1,
    paddingLeft: 0,
    paddingRight: 0,
    marginTop: theme.spacing(-1),
}));

const FieldActions = styled(Box)<BoxProps>({
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
});

export const EntityView: FC<EntityViewProps> = ({ id }) => {
    const animationPack = useSelect((state) => state.animationPack);
    const scenes = useSelect((state) => state.game?.scenes ?? []);
    const templates = useSelect((state) => state.game?.templates ?? []);
    const entity = useSelect((state) => state.game!.entities.find((entity) => entity.id === id), [id]);
    const setView = useSetter("sideView");
    const setPointListener = useFlagSetter("pointListener");
    const [isPlayer, setPlayer] = useState(entity?.isPlayer ?? false);
    const [sceneId, setSceneId] = useState(entity?.scene ?? null);
    const [templateId, setTemplateId] = useState(entity?.template ?? null);
    const [x, setX] = useState(entity?.x ?? 0);
    const [y, setY] = useState(entity?.y ?? 0);
    const [velocity, setVelocity] = useState(entity?.velocity ?? 0);
    const [velocityAngle, setVelocityAngle] = useState(entity?.velocityAngle ?? 0);
    const [force, setForce] = useState(entity?.force ?? 0);
    const [forceAngle, setForceAngle] = useState(entity?.forceAngle ?? 0);
    const [animation, setAnimation] = useState(entity?.animation ?? null);
    const sceneOptions = useMemo(() => new Map(scenes.map((scene) => [scene.id, scene.name])), [scenes]);
    const templateOptions = useMemo(() => new Map(templates.map((template) => [template.id, template.name])), [templates]);
    const template = useMemo(() => templates.find((template) => template.id === templateId), [templateId, templates]);
    const animationOptions = useMemo(() => {
        const animationCollection = (animationPack?.collections ?? []).find((collection) => collection.id === template?.animations);
        const animationIds = Array.from(Object.values(animationCollection?.animations ?? {}));
        return new Map(
            (animationPack?.animations ?? [])
                .filter((animation) => animationIds.includes(animation.id))
                .map((animation) => [animation.id, animation.name])
        );
    }, [animationPack, template]);
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
                        velocityAngle,
                        force,
                        forceAngle,
                        scene: sceneId ?? -1,
                        template: templateId ?? -1,
                        animation: animation ?? undefined,
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
                            velocityAngle,
                            force,
                            forceAngle,
                            scene: sceneId ?? -1,
                            template: templateId ?? -1,
                            animation: animation ?? undefined,
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
                    <FieldCollection>
                        <FieldSet>
                            <UnitField label="Spawn X coordinate" units="m" type="number" value={x} onChange={handleNumber(setX)} />
                            <UnitField label="Spawn Y coordinate" units="m" type="number" value={y} onChange={handleNumber(setY)} />
                        </FieldSet>
                        <FieldActions>
                            <IconButton onClick={() => setPointListener((point) => {
                                setX(point.x);
                                setY(point.y);
                            })}>
                                <MyLocation />
                            </IconButton>
                        </FieldActions>
                    </FieldCollection>
                    <Hide show={template?.traits.includes(Trait.VISIBLE)}>
                        <Combobox label="Animation at spawn" value={animation} options={animationOptions} onChange={setAnimation} />
                    </Hide>
                    <Hide show={template?.traits.includes(Trait.MOBILE)}>
                        <UnitField label="Spawn with inital velocity" units="m/s" type="number" value={velocity} onChange={handleNumber(setVelocity)} />
                        <UnitField label="Spawn with initial movement angle" units="rad" type="number" value={velocityAngle} onChange={handleNumber(setVelocityAngle)} />
                        <UnitField label="Spawn with initial movement force" units="N" type="number" value={force} onChange={handleNumber(setForce)} />
                        <UnitField label="Spawn with initial force angle" units="rad" type="number" value={forceAngle} onChange={handleNumber(setForceAngle)} />
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