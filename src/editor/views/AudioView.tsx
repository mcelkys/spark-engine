import { Fragment, useEffect, useMemo, useState, type FC } from "react";
import { useSelect } from "../state";
import { BottomForm, ButtonGroup, DialogButtons, FormHead, FormHeadActions, FormList, H5, Id } from "../styled";
import IconButton from "@mui/material/IconButton";
import Add from "@mui/icons-material/Add";
import Close from "@mui/icons-material/Close";
import { useMutation, useSetter } from "../hooks/state";
import Divider from "@mui/material/Divider";
import ListItem from "@mui/material/ListItem";
import Delete from "@mui/icons-material/Delete";
import ListItemText from "@mui/material/ListItemText";
import Dialog from "@mui/material/Dialog";
import DialogContent, { type DialogContentProps } from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import { handleString } from "../util/input";
import { styled } from "@mui/material/styles";
import Edit from "@mui/icons-material/Edit";

const Content = styled(DialogContent)<DialogContentProps>(({ theme }) => ({
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing(3),
    paddingTop: `${theme.spacing(1)} !important`,
}));

export const AudioListView: FC = () => {
    const audio = useSelect((state) => state.game?.audio ?? []);
    const setBottomView = useSetter("bottomView");
    const remove = useMutation<[number]>((state, id) => ({
        ...state,
        game: {
            ...state.game!,
            audio: (state.game?.audio ?? []).filter((audio) => audio.id !== id),
        },
    }));
    const [ audioId, setAudioId ] = useState<number>();
    const audioSource = useMemo(() => audio.find((aud) => aud.id === audioId), [audio, audioId]);
    const [ name, setName ] = useState("");
    const [ source, setSource ] = useState("");
    const submit = useMutation((state) => ({
        ...state,
        game: {
            ...state.game!,
            audio: !audioSource 
                ? [
                    ...(state.game?.audio ?? []),
                    {
                        id: audioId!,
                        name,
                        source,
                    },
                ] 
                : (state.game?.audio ?? []).map((aud) => {
                    if (aud.id === audioId) {
                        return { ...aud, name, source };
                    }
                    return aud;
                }),
        },
    }));

    useEffect(() => {
        setName(audioSource?.name ?? "");
        setSource(audioSource?.source ?? "");
    }, [audioSource]);

    const closeAdd = () => {
        setAudioId(undefined);
    };
    
    return (
        <Fragment>
            <BottomForm>
                <FormHead>
                    <H5>Audio sources</H5>
                    <FormHeadActions>
                        <IconButton onClick={() => setAudioId(audio.reduce((id, aud) => id > aud.id ? id : aud.id + 1, 0))}>
                            <Add />
                        </IconButton>
                        <IconButton onClick={() => setBottomView(undefined)}>
                            <Close />
                        </IconButton>
                    </FormHeadActions>
                </FormHead>
                <FormList>
                    <Divider />
                    {audio.map((aud) => (
                        <Fragment key={aud.id}>
                            <ListItem secondaryAction={
                                <ButtonGroup>
                                    <IconButton onClick={() => setAudioId(aud.id)}>
                                        <Edit />
                                    </IconButton>
                                    <IconButton onClick={() => remove(aud.id)}>
                                        <Delete />
                                    </IconButton>
                                </ButtonGroup>
                            }>
                                <ListItemText primary={
                                    <Fragment>
                                        <Id component="span">{aud.id}</Id>
                                        {aud.name}
                                    </Fragment>
                                } />
                            </ListItem>
                            <Divider />
                        </Fragment>
                    ))}
                </FormList>
            </BottomForm>
            <Dialog open={typeof audioId === "number"} onClose={closeAdd} maxWidth="md" fullWidth>
                <DialogTitle>{audioSource?.name ?? "New audio source"}</DialogTitle>
                <Content>
                    <TextField label="Audio source name" value={name} onChange={handleString(setName)} />
                    <TextField label="Audio source file" value={source} onChange={handleString(setSource)} />
                </Content>
                <DialogButtons>
                    <Button onClick={closeAdd}>Cancel</Button>
                    <Button variant="contained" onClick={() => {
                        submit();
                        closeAdd();
                    }}>Confirm</Button>
                </DialogButtons>
            </Dialog>
        </Fragment>
    );
};