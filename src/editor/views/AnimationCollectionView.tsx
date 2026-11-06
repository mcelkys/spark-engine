import { Fragment, useMemo, useState, type FC } from "react";
import { DialogButtons, FormAction, FormFields, FormHeading, FormList, SideForm } from "../styled";
import { useSelect } from "../state";
import TextField from "@mui/material/TextField";
import { handleString } from "../util/input";
import Button from "@mui/material/Button";
import { useMutation, useSetter } from "../hooks/state";
import Divider from "@mui/material/Divider";
import { AnimationPurpose } from "../../types/assets";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import { styled } from "@mui/material/styles";
import Box, { type BoxProps } from "@mui/material/Box";
import KeyboardDoubleArrowRightIcon from '@mui/icons-material/KeyboardDoubleArrowRight';
import ButtonGroup from "@mui/material/ButtonGroup";
import IconButton from "@mui/material/IconButton";
import Delete from "@mui/icons-material/Delete";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import { Combobox } from "../components/Combobox";

const PURPOSES = new Map<AnimationPurpose, string>([
    [AnimationPurpose.IDLE, "Idle"],
    [AnimationPurpose.MOVE_UP, "Move upwards"],
    [AnimationPurpose.MOVE_RIGHT, "Move rightwards"],
    [AnimationPurpose.MOVE_DOWN, "Move downwards"],
    [AnimationPurpose.MOVE_LEFT, "Move leftwards"],
]);

interface AnimationCollectionViewProps {
    id: number;
}

const DisplayBox = styled(Box)<BoxProps>(({ theme }) => ({
    display: "inline-flex",
    alignItems: "center",
    gap: theme.spacing(2),
}));

const Fields = styled(FormFields)({
    flex: "unset",
});

const List = styled(FormList)({
    flex: 1,
});

const Toolbar = styled(FormAction)({
    justifyContent: "center",
});

const Content = styled(DialogContent)(({ theme }) => ({
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing(3),
}));

export const AnimationCollectionView: FC<AnimationCollectionViewProps> = ({ id }) => {
    const allAnimations = useSelect((state) => state.animationPack?.animations ?? []);
    const collection = useSelect((state) => state.animationPack?.collections.find((collection) => collection.id === id), [id]);
    const setView = useSetter("sideView");
    const [name, setName] = useState(collection?.name ?? "");
    const [animations, setAnimations] = useState(collection?.animations ?? {} as Record<AnimationPurpose, number>);
    const [isAddOpen, setAddOpen] = useState(false);
    const animationLookup = useMemo(() => {
        return new Map(allAnimations.map((ani) => [ani.id, ani.name]));
    }, [allAnimations]);
    const [purpose, setPurpose] = useState<AnimationPurpose | null>(null);
    const [selectedAnimation, setSelectedAnimation] = useState<number | null>(null);
    const submit = useMutation((state) => ({
            ...state,
            animationPack: {
                ...state.animationPack!,
                collections: !collection 
                    ? [
                        ...(state.animationPack?.collections ?? []),
                        {
                            id,
                            name,
                            animations,
                        },
                    ] 
                    : (state.animationPack?.collections ?? []).map((col) => {
                        if (col.id === id) {
                            return { ...col, name, animations };
                        }
                        return col;
                    }),
            },
        }));

    const closeAdd = () => {
        setAddOpen(false);
        setPurpose(null);
        setSelectedAnimation(null);
    };
    
    return (
        <Fragment>
            <SideForm>
                <FormHeading>{collection?.name ?? "New animation collection"}</FormHeading>
                <Fields>
                    <TextField label="Animation collection name" value={name} onChange={handleString(setName)} />
                </Fields>
                <List>
                    <Divider />
                    {Array.from(Object.entries(animations)).map(([purpose, animationId]) => (
                        <Fragment key={purpose}>
                            <ListItem secondaryAction={
                                <ButtonGroup>
                                    <IconButton onClick={() => setAnimations((before) => {
                                        const after: Record<string, number> = {...before};
                                        delete after[purpose as keyof typeof after];
                                        return after as Record<AnimationPurpose, number>;
                                    })}>
                                        <Delete />
                                    </IconButton>
                                </ButtonGroup>
                            }>
                                <ListItemText primary={
                                    <DisplayBox component="span">
                                        <span>{PURPOSES.get(parseInt(purpose))}</span>
                                        <KeyboardDoubleArrowRightIcon />
                                        <span>{animationLookup.get(animationId)}</span>
                                    </DisplayBox>
                                } />
                            </ListItem>
                            <Divider />
                        </Fragment>
                    ))}
                </List>
                <Toolbar>
                    <Button onClick={() => setAddOpen(true)}>Assign animation</Button>
                </Toolbar>
                <FormAction>
                    <Button onClick={() => setView(undefined)}>Cancel</Button>
                    <Button variant="contained" onClick={() => {
                        submit();
                        setView(undefined);
                    }}>Save</Button>
                </FormAction>
            </SideForm>
            <Dialog open={isAddOpen} onClose={closeAdd} maxWidth="md" fullWidth>
                <Content>
                    <Combobox
                        label={`Select animation purpose to assign to ${collection?.name ?? "new animation collection"}`}
                        value={purpose}
                        options={PURPOSES}
                        onChange={setPurpose}
                    />
                    <Combobox
                        label={typeof purpose === "number" ? `Select animation to serve "${PURPOSES.get(purpose)}" purpose` : "Select animation"}
                        value={selectedAnimation}
                        options={animationLookup}
                        onChange={setSelectedAnimation}
                    />
                </Content>
                <DialogButtons>
                    <Button onClick={closeAdd}>Cancel</Button>
                    <Button variant="contained" disabled={typeof purpose !== "number" || typeof selectedAnimation !== "number"} onClick={() => {
                        setAnimations((before) => {
                            const after = { ...before };
                            after[purpose!] = selectedAnimation!;
                            return after;
                        });
                        closeAdd();
                    }}>Add</Button>
                </DialogButtons>
            </Dialog>
        </Fragment>
    );
};