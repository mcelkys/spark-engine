import { useMemo, type FC, type ReactNode } from "react";
import TextField from "@mui/material/TextField";
import Autocomplete from "@mui/material/Autocomplete";

export interface ComboboxProps<T> {
    label?: ReactNode;
    value?: T | null;
    options: Map<T, string>;
    onChange: (value: T | null) => void;
}

export function Combobox<T>({ label, value, options, onChange }: ComboboxProps<T>): ReactNode {
    const opts = useMemo(() => Array.from(options.keys()), [options]);
    return (
        <Autocomplete
            autoComplete
            autoHighlight
            value={value}
            options={opts}
            getOptionLabel={(option) => options.get(option)!}
            renderInput={(props) => <TextField {...props} label={label} />}
            onChange={(_, val) => onChange(val)}
        />
    );
}