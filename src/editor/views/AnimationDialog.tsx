import { Button, Dialog, DialogTitle, IconButton, TextField, Typography } from "@mui/material";
import DialogContent, { type DialogContentProps } from "@mui/material/DialogContent";
import Card, { type CardProps } from "@mui/material/Card";
import CardContent, { type CardContentProps } from "@mui/material/CardContent";
import CardActions, { type CardActionsProps } from "@mui/material/CardActions";
import CardMedia, { type CardMediaProps } from "@mui/material/CardMedia";
import Box, { type BoxProps } from "@mui/material/Box";
import { Fragment, useState, type FC } from "react";
import { DialogButtons, FormFields } from "../styled";
import { styled } from "@mui/material/styles";
import { useSelect } from "../state";
import { SpriteImage } from "../components/SpriteImage";
import { handleNumber, handleString } from "../util/input";
import { UnitField } from "../components/UnitField";
import { AnimationPreview } from "../components/AnimationPreview";
import { Delete, KeyboardArrowUp } from "@mui/icons-material";
import KeyboardArrowDown from "@mui/icons-material/KeyboardArrowDown";
import Autocomplete from "@mui/material/Autocomplete";
import { useMutation } from "../hooks/state";

const DIALOG_SLOTS = {
    paper: {
        sx: { height: "100%" },
    },
};

interface AnimationDialogProps {
    open: boolean;
    id?: number;
    onClose: VoidFunction;
}

const Content = styled(DialogContent)<DialogContentProps>(({ theme }) => ({
    display: "flex",
    gap: theme.spacing(3),
}));

const AnimationContainer = styled(Box)<BoxProps>({
    width: "30%",
});

const FormContainer = styled(Box)<BoxProps>(({ theme }) => ({
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing(2),
}));

const FrameContainer = styled(Box)<BoxProps>(({ theme }) => ({
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing(1),
    flex: 1,
    overflowY: "auto",
    paddingLeft: theme.spacing(3),
    paddingRight: theme.spacing(3),
}));

const FrameCard = styled(Card)<CardProps>(({ theme }) => ({
    height: 120,
    display: "flex",
    flexShrink: 0,
}));

const FrameMedia = styled(CardMedia)<CardMediaProps>(({ theme }) => ({
    width: 120,
    padding: theme.spacing(1),
}));

const FrameContent = styled(CardContent)<CardContentProps>(({ theme }) => ({
    flex: 1,
}));

const FrameActions = styled(CardActions)<CardActionsProps>(({ theme }) => ({
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
}));

const Toolbar = styled(Box)<BoxProps>(({ theme }) => ({
    display: "flex",
    justifyContent: "center",
    gap: theme.spacing(2),
    paddingTop: theme.spacing(2),
}));

const OptionSprite = styled(Box)<BoxProps>(({ theme }) => ({
    width: 30,
    height: 30,
    display: "inline-block",
    marginRight: theme.spacing(3),
}));

export const AnimationDialog: FC<AnimationDialogProps> = ({ open, id, onClose }) => {
    const texture = useSelect((state) => state.texture);
    const allSprites = useSelect((state) => state.sprites);
    const animation = useSelect((state) => state.animationPack?.animations.find((a) => a.id === id));
    const [name, setName] = useState(animation?.name ?? "");
    const [duration, setDuration] = useState(animation?.duration ?? 0);
    const [frames, setFrames] = useState(animation?.frames ?? []);
    const [isAddOpen, setAddOpen] = useState(false);
    const [frame, setFrame] = useState<string | null>(null);
    const submit = useMutation((state) => ({
        ...state,
        animationPack: {
            ...state.animationPack!,
            animations: !animation
                ? [
                    ...(state.animationPack?.animations ?? []),
                    {
                        id: id!,
                        name,
                        duration,
                        frames,
                    }
                ] 
                : (state.animationPack?.animations ?? []).map((ani) => {
                    if (ani.id === id) {
                        return {
                            ...ani,
                            name,
                            duration,
                            frames,
                        };
                    }
                    return ani;
                }),
        },
    }));

    const closeAdd = () => {
        setAddOpen(false);
        setFrame(null);
    };

    return (
        <Fragment>
            <Dialog open={open} fullWidth maxWidth={false} slotProps={DIALOG_SLOTS}>
                <DialogTitle>{animation?.name ?? "New animation"}</DialogTitle>
                <Content>
                    <AnimationContainer>
                        {!texture || !allSprites ? null : (
                            <AnimationPreview texture={texture} sprites={allSprites} duration={duration} frames={frames} />
                        )}
                    </AnimationContainer>
                    <FormContainer>
                        <FormFields sx={{ flex: 0, overflowY: "initial" }}>
                            <TextField label="Animation name" value={name} onChange={handleString(setName)} />
                            <UnitField label="Duration" units="s" type="number" value={duration} onChange={handleNumber(setDuration)} />
                        </FormFields>
                        <FrameContainer>
                            {frames.map((frame, index) => {
                                const idx = allSprites!.name.indexOf(frame);
                                return (
                                    <FrameCard key={index}>
                                        <FrameMedia>
                                            <SpriteImage
                                                bitmap={texture!}
                                                u0={allSprites?.u0[idx]!}
                                                v0={allSprites?.v0[idx]!}
                                                u1={allSprites?.u1[idx]!}
                                                v1={allSprites?.v1[idx]!}
                                            />
                                        </FrameMedia>
                                        <FrameContent>
                                            <Typography>{frame}</Typography>
                                        </FrameContent>
                                        <CardActions>
                                            <IconButton onClick={() => setFrames((frames) => frames.filter((f) => f !== frame))}>
                                                <Delete />
                                            </IconButton>
                                        </CardActions>
                                        <FrameActions disableSpacing>
                                            <IconButton disabled={index < 1} onClick={() => setFrames((before) => {
                                                const after = [...before];
                                                after[index - 1] = before[index]!;
                                                after[index] = before[index - 1]!;
                                                return after;
                                            })}>
                                                <KeyboardArrowUp />
                                            </IconButton>
                                            <IconButton disabled={index + 1 >= frames.length} onClick={() => setFrames((before) => {
                                                const after = [...before];
                                                after[index + 1] = before[index]!;
                                                after[index] = before[index + 1]!;
                                                return after;
                                            })}>
                                                <KeyboardArrowDown />
                                            </IconButton>
                                        </FrameActions>
                                    </FrameCard>
                                );
                            })}
                        </FrameContainer>
                        <Toolbar>
                            <Button onClick={() => setAddOpen(true)}>Add frame</Button>
                        </Toolbar>
                    </FormContainer>
                </Content>
                <DialogButtons>
                    <Button onClick={onClose}>Cancel</Button>
                    <Button variant="contained" onClick={() => {
                        submit();
                        onClose();
                    }}>Confirm</Button>
                </DialogButtons>
            </Dialog>
            <Dialog open={isAddOpen} onClose={closeAdd} maxWidth="md" fullWidth>
                <DialogContent>
                    <Autocomplete
                        autoComplete
                        autoHighlight
                        value={frame}
                        options={allSprites?.name ?? []}
                        renderOption={({ key, ...props }, option) => {
                            const idx = allSprites!.name.indexOf(option);
                            return (
                                <li key={key} {...props}>
                                    <OptionSprite>
                                        <SpriteImage
                                            bitmap={texture!}
                                            u0={allSprites?.u0[idx]!}
                                            v0={allSprites?.v0[idx]!}
                                            u1={allSprites?.u1[idx]!}
                                            v1={allSprites?.v1[idx]!}
                                        />
                                    </OptionSprite>
                                    <Typography component="span">{option}</Typography>
                                </li>
                            );
                        }}
                        renderInput={(props) => (
                            <TextField {...props} label="Select sprite to add to animation" />
                        )}
                        onChange={(_, val) => setFrame(val)}
                    />
                </DialogContent>
                <DialogButtons>
                    <Button onClick={closeAdd}>Cancel</Button>
                    <Button variant="contained" disabled={!frame} onClick={() => {
                        setFrames((f) => [...f, frame!]);
                        closeAdd();
                    }}>Add</Button>
                </DialogButtons>
            </Dialog>
        </Fragment>
    );
};