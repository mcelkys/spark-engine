import { Button, Dialog, DialogContent, DialogTitle, TextField, Typography } from "@mui/material";
import Box, { type BoxProps } from "@mui/material/Box";
import { useState, type FC } from "react";
import { DialogButtons } from "../styled";
import { styled } from "@mui/material/styles";
import { useSelect } from "../state";
import { SpriteImage } from "../components/SpriteImage";

interface SpriteDialogProps {
    open: boolean;
    onClose: VoidFunction;
}

const SpriteContainer = styled(Box)<BoxProps>(({ theme }) => ({
    marginTop: theme.spacing(2),
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))",
    gap: theme.spacing(2),
    overflowY: "auto",
    maxHeight: "100%",
    minHeight: 0,
}));

const SpriteCard = styled(Box)<BoxProps>(({ theme }) => ({
    ...theme.shape,
    backgroundColor: theme.palette.background.paper,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    gap: theme.spacing(1),
    padding: theme.spacing(1),
}));

export const SpriteDialog: FC<SpriteDialogProps> = ({ open, onClose }) => {
    const sprites = useSelect((state) => state.sprites);
    const bitmap = useSelect((state) => state.texture!);

    return (
        <Dialog open={open} fullWidth maxWidth={false}>
            <DialogTitle>Import texture atlas</DialogTitle>
            <DialogContent>
                <TextField label="Texture atlas" type="file" />
                <SpriteContainer>
                    {(sprites?.name ?? []).map((name, idx) => (
                        <SpriteCard key={name}>
                            <SpriteImage
                                bitmap={bitmap}
                                u0={sprites?.u0[idx]!}
                                v0={sprites?.v0[idx]!}
                                u1={sprites?.u1[idx]!}
                                v1={sprites?.v1[idx]!}
                            />
                            <Typography variant="subtitle2">{name}</Typography>
                        </SpriteCard>
                    ))}
                </SpriteContainer>
            </DialogContent>
            <DialogButtons>
                <Button onClick={onClose}>Cancel</Button>
                <Button variant="contained">Confirm</Button>
            </DialogButtons>
        </Dialog>
    );
};