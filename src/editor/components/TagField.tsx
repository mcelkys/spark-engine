import { useMemo, type ReactNode } from "react";
import TextField from "@mui/material/TextField";
import Chip from "@mui/material/Chip";
import Autocomplete from "@mui/material/Autocomplete";

export interface TagFieldProps<T> {
    label?: ReactNode
    value: Set<T>;
    exclude?: Set<T>;
    options: Map<T, string>;
    onChange: (value: Set<T>) => void;
}

export function TagField<T>({ label, value, options, exclude, onChange }: TagFieldProps<T>): ReactNode {
    const included = useMemo(() => {
        return Array.from(options.keys())
            .filter((option) => !exclude || !exclude.has(option));
    }, [options, exclude]);

    return (
        <Autocomplete
            multiple
            autoComplete
            autoHighlight
            value={Array.from(value)}
            options={included}
            getOptionLabel={(option) => options.get(option)!}
            renderValue={(list, getProps) => list.map((option, index) => {
                const { key, ...props } = getProps({ index });
                return (
                    <Chip {...props} key={key} label={options.get(option)} />
                );
            })}
            renderInput={(props) => (
                <TextField {...props} label={label} />
            )}
            onChange={(_, values) => onChange(new Set(values))}
        />
    );
}