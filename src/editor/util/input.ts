import type { ChangeEventHandler, Dispatch, SetStateAction } from "react";

export function handleString(set: Dispatch<SetStateAction<string>>): ChangeEventHandler<HTMLInputElement> {
    return (event) => set(event.target.value);
}

export function handleNumber(set: Dispatch<SetStateAction<number>>): ChangeEventHandler<HTMLInputElement> {
    return (event) => {
        const value = Number(event.target.value);
        set(Number.isNaN(value) ? 0 : value);
    };
}