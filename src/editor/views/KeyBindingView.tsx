import { Fragment, useCallback, useState, type FC } from "react";
import { BottomForm, DialogButtons, FormHead, FormHeadActions, FormList, H5 } from "../styled";
import Divider from "@mui/material/Divider";
import ListItem from "@mui/material/ListItem";
import ButtonGroup from "@mui/material/ButtonGroup";
import IconButton from "@mui/material/IconButton";
import Delete from "@mui/icons-material/Delete";
import ListItemText from "@mui/material/ListItemText";
import { useSelect } from "../state";
import { useMutation, useSetter } from "../hooks/state";
import { Input } from "../../types/input";
import KeyboardDoubleArrowRightIcon from '@mui/icons-material/KeyboardDoubleArrowRight';
import { styled } from "@mui/material/styles";
import Box, { type BoxProps } from "@mui/material/Box";
import Add from "@mui/icons-material/Add";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import Button from "@mui/material/Button";
import { Combobox } from "../components/Combobox";
import Typography from "@mui/material/Typography";
import { Close } from "@mui/icons-material";

const INPUTS = new Map<Input, string>([
    [Input.UP, "Move upwards"],
    [Input.RIGHT, "Move rightwards"],
    [Input.DOWN, "Move downwards"],
    [Input.LEFT, "Move leftwards"],
    [Input.PAUSE, "Pause / resume"],
]);

const InputDisplay = styled(Box)<BoxProps>(({ theme }) => ({
    display: "inline-flex",
    alignItems: "center",
    gap: theme.spacing(2),
}));

const BindBox = styled(Box)<BoxProps>(({ theme }) => ({
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: 300,
    marginTop: theme.spacing(3),
    borderStyle: "dashed",
    borderWidth: 3,
    borderColor: theme.palette.grey[600],
    borderRadius: 12,
}))

export const KeyBindingView: FC = () => {
    const bindings = useSelect((state) => state.game?.keyBindings ?? {});
    const engine = useSelect((state) => state.engine);
    const setView = useSetter("bottomView");
    const [key, setKey] = useState<string>();
    const [input, setInput] = useState<Input | null>(null);
    const [showDialog, setShowDialog] = useState(false);
    const onPress = useCallback((event: KeyboardEvent) => {
        setKey(event.code);
    }, []);

    const add = () => {
        if (engine) {
            engine.input.stop();
            setInput(null);
            setKey(undefined);
            document.addEventListener("keyup", onPress, { passive: true });
            setShowDialog(true);
        }
    };
    const close = () => {
        if (engine) {
            engine.input.start()
            setInput(null);
            setKey(undefined);
            document.removeEventListener("keyup", onPress);
            setShowDialog(false);
        }
    };
    const save = useMutation((state) => typeof key !== "string" || typeof input !== "number" ? state : ({
        ...state,
        game: {
            ...state.game!,
            keyBindings: {
                ...state.game?.keyBindings,
                [key]: input,
            },
        },
    }));
    const remove = useMutation<[string]>((state, key) => ({
        ...state,
        game: {
            ...state.game!,
            keyBindings: Object.fromEntries(Object.entries(state.game?.keyBindings ?? {}).filter(([k]) => k !== key)),
        },
    }));
    const confirm = () => {
        save();
        close();
    };

    return (
        <Fragment>
            <BottomForm>
                <FormHead>
                    <H5>Key bindings</H5>
                    <FormHeadActions>
                        <IconButton onClick={add}>
                            <Add />
                        </IconButton>
                        <IconButton onClick={() => setView(undefined)}>
                            <Close />
                        </IconButton>
                    </FormHeadActions>
                </FormHead>
                <FormList>
                    <Divider />
                    {Array.from(Object.entries(bindings)).map(([key, input]) => (
                        <Fragment key={key}>
                            <ListItem secondaryAction={
                                <ButtonGroup>
                                    <IconButton onClick={() => remove(key)}>
                                        <Delete />
                                    </IconButton>
                                </ButtonGroup>
                            }>
                                <ListItemText primary={
                                    <InputDisplay component="span">
                                        <span>{key}</span>
                                        <KeyboardDoubleArrowRightIcon />
                                        <span>{INPUTS.get(input)}</span>
                                    </InputDisplay>
                                } />
                            </ListItem>
                            <Divider />
                        </Fragment>
                    ))}
                </FormList>
            </BottomForm>
            <Dialog open={showDialog} onClose={close} maxWidth="md" fullWidth>
                <DialogContent>
                    <Combobox
                        label="Input type"
                        value={input}
                        options={INPUTS}
                        onChange={setInput}
                    />
                    <BindBox>
                        <Typography variant="h2" component="span">
                            {key ?? "Press key to bind"}
                        </Typography>
                    </BindBox>
                </DialogContent>
                <DialogButtons>
                    <Button onClick={close}>Cancel</Button>
                    <Button variant="contained" disabled={typeof key !== "string" || typeof input !== "number"} onClick={confirm}>
                        Confirm
                    </Button>
                </DialogButtons>
            </Dialog>
        </Fragment>
    );
};