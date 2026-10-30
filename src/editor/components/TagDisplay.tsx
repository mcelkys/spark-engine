import { useMemo, type FC, type ReactNode } from "react";
import Stack, { type StackProps } from "@mui/material/Stack";
import Chip from "@mui/material/Chip";
import { styled } from "@mui/material/styles";
import IconButton, { type IconButtonProps } from "@mui/material/IconButton";
import Add from "@mui/icons-material/Add";

const Container = styled(Stack)<StackProps>(({ theme }) => ({
    paddingLeft: theme.spacing(3),
    paddingRight: theme.spacing(3),
    alignItems: "center",
    justifyContent: "space-between",
}));

export interface TagDisplayProps<T> {
    values?: Set<T>;
    labels: Map<T, string>;
    onAdd?: IconButtonProps["onClick"];
    onDelete?: (value: T) => void;
}

export function TagDisplay<T>({ values, labels, onAdd, onDelete }: TagDisplayProps<T>): ReactNode {
    const vals = useMemo(() => values ? Array.from(values.values()) : [], [values]);
    return (
        <Container direction="row" spacing={1}>
            <Stack direction="row" spacing={1}>
                {vals.map((value, index) => (
                    <Chip
                        key={index}
                        label={labels.get(value)}
                        onDelete={typeof onDelete === "function" ? () => onDelete(value) : undefined}
                    />
                ))}
            </Stack>
            <IconButton onClick={onAdd}>
                <Add />
            </IconButton>
        </Container>
    );
}