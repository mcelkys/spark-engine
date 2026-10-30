import type { FC, ReactNode } from "react";
import TextField, { type TextFieldProps } from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";

export type UnitFieldProps = TextFieldProps & {
    units: ReactNode;
};

export const UnitField: FC<UnitFieldProps> = ({ units, ...props }) => (
    <TextField {...props} slotProps={{
        input: {
            endAdornment: (
                <InputAdornment position="end">
                    <var>{units}</var>
                </InputAdornment>
            )
        }
    }} />
);