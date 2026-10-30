import { Fragment, useState, type FC } from "react";
import { useSelect } from "../state";
import { useMutation, useSetter } from "../hooks/state";
import { FormAction, FormFields, FormHeading, SideForm } from "../styled";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import { handleNumber, handleString } from "../util/input";
import { Trait } from "../../types/entity";
import { styled } from "@mui/material/styles";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogActions, { type DialogActionsProps } from "@mui/material/DialogActions";
import { TagField } from "../components/TagField";
import { UnitField } from "../components/UnitField";
import { Hide } from "../components/Hide";
import { TagDisplay } from "../components/TagDisplay";

const TRAITS = new Map<Trait, string>([
    [Trait.MOBILE, "Mobile"],
    [Trait.TANGIBLE, "Tangible"],
    [Trait.TILED, "Tiled"],
    [Trait.HAS_STATIC_DEPTH, "Static depth"],
]);

interface TemplateViewProps {
    id: number;
}

const TraitActions = styled(DialogActions)<DialogActionsProps>(({ theme }) => ({
    paddingLeft: theme.spacing(3),
    paddingRight: theme.spacing(3),
    paddingBottom: theme.spacing(3),
}));

export const TemplateView: FC<TemplateViewProps> = ({ id }) => {
    const template = useSelect((state) => state.game!.templates.find((template) => template.id === id), [id]);
    const setView = useSetter("sideView");
    const [name, setName] = useState(template?.name ?? "");
    const [traits, setTraits] = useState(new Set(template?.traits));
    const [scaleX, setScaleX] = useState(template?.scaleX ?? 0);
    const [scaleY, setScaleY] = useState(template?.scaleY ?? 0);
    const [tileScaleX, setTileScaleX] = useState(template?.tileScaleX ?? 0);
    const [tileScaleY, setTileScaleY] = useState(template?.tileScaleY ?? 0);
    const [hitboxScaleX, setHitboxScaleX] = useState(template?.hitboxScaleX ?? template?.scaleX ?? 0);
    const [hitboxScaleY, setHitboxScaleY] = useState(template?.hitboxScaleY ?? template?.scaleY ?? 0);
    const [mass, setMass] = useState(template?.mass ?? 0);
    const [dragCoefficient, setDragCoefficient] = useState(template?.dragCoefficient ?? 1.2);
    const [runForce, setRunForce] = useState(template?.runForce ?? 0);
    const [depth, setDepth] = useState(template?.depth ?? 0);
    const [isAddOpen, setAddOpen] = useState(false);
    const [selectedTraits, setSelectedTraits] = useState<Set<Trait>>(new Set());
    const submit = useMutation((state) => ({
        ...state,
        game: {
            ...state.game!,
            templates: (state.game?.templates ?? []).map((t) => {
                if (t.id === template?.id) {
                    return {
                        ...t,
                        name,
                        traits: Array.from(traits),
                        scaleX,
                        scaleY,
                        tileScaleX,
                        tileScaleY,
                        hitboxScaleX,
                        hitboxScaleY,
                        mass,
                        dragCoefficient,
                        runForce,
                        depth,
                    };
                }
                return t;
            }),
        },
    }));
    const confirm = () => {
        submit();
        setView(undefined);
    };
    const closeAddDialog = () => {
        setSelectedTraits(new Set());
        setAddOpen(false);
    };
    const addTraits = () => {
        setTraits((traits) => traits.union(selectedTraits));
        closeAddDialog();
    };

    return (
        <Fragment>
            <SideForm>
                <FormHeading variant="h2">{template?.name}</FormHeading>
                <TagDisplay
                    values={traits}
                    labels={TRAITS}
                    onAdd={() => setAddOpen(true)}
                    onDelete={(trait) => setTraits((traits) => {
                        const updated = new Set(traits);
                        updated.delete(trait);
                        return updated;
                    })}
                />
                <FormFields>
                    <TextField label="Template name" value={name} onChange={handleString(setName)} />
                    <UnitField label="Visual width" units="m" type="number" value={scaleX} onChange={handleNumber(setScaleX)} />
                    <UnitField label="Visual height" units="m" type="number" value={scaleY} onChange={handleNumber(setScaleY)} />
                    <Hide show={traits.has(Trait.TILED)}>
                        <UnitField label="Tile width" units="m" type="number" value={tileScaleX} onChange={handleNumber(setTileScaleX)} />
                        <UnitField label="Tile height" units="m" type="number" value={tileScaleY} onChange={handleNumber(setTileScaleY)} />
                    </Hide>
                    <Hide show={traits.has(Trait.TANGIBLE)}>
                        <UnitField label="Hitbox width" units="m" type="number" value={hitboxScaleX} onChange={handleNumber(setHitboxScaleX)} />
                        <UnitField label="Hitbox height" units="m" type="number" value={hitboxScaleY} onChange={handleNumber(setHitboxScaleY)} />
                    </Hide>
                    <Hide show={traits.has(Trait.MOBILE)}>
                        <UnitField label="Mass" units="kg" type="number" value={mass} onChange={handleNumber(setMass)} />
                        <TextField label="Drag coefficient" type="number" value={dragCoefficient} onChange={handleNumber(setDragCoefficient)} />
                        <UnitField label="Movement force" units="N" type="number" value={runForce} onChange={handleNumber(setRunForce)} />
                    </Hide>
                    <Hide show={traits.has(Trait.HAS_STATIC_DEPTH)}>
                        <TextField label="Render depth index" type="number" value={depth} onChange={handleNumber(setDepth)} />
                    </Hide>
                </FormFields>
                <FormAction>
                    <Button onClick={() => setView(undefined)}>Cancel</Button>
                    <Button variant="contained" onClick={confirm}>Save</Button>
                </FormAction>
            </SideForm>
            <Dialog open={isAddOpen} onClose={closeAddDialog} maxWidth="md" fullWidth>
                <DialogContent>
                    <TagField
                        label={`Select traits to add to ${template?.name} template`}
                        value={selectedTraits}
                        options={TRAITS}
                        exclude={traits}
                        onChange={setSelectedTraits}
                    />
                </DialogContent>
                <TraitActions>
                    <Button onClick={closeAddDialog}>Cancel</Button>
                    <Button variant="contained" onClick={addTraits}>Add</Button>
                </TraitActions>
            </Dialog>
        </Fragment>
    );
};