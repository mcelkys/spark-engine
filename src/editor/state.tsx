import { createContext, useContext, useMemo, useReducer, type DependencyList, type Dispatch, type FC, type PropsWithChildren } from "react";
import type { EditorAction, EditorState } from "./types";
import { reducer } from "./reducer";

type ContextState = [EditorState, Dispatch<EditorAction>];
export type Selector<T> = (state: EditorState) => T;

const EditorContext = createContext<ContextState>([
    {
        flags: {
            selectingEntity: false,
            movingEngity: false,
        },
    },
    () => {},
]);

export const EditorProvider: FC<PropsWithChildren> = ({ children }) => {
    const value = useReducer(reducer, {
        flags: {
            selectingEntity: false,
            movingEngity: false,
        },
    });
    return (
        <EditorContext value={value}>{children}</EditorContext>
    );
};

export function useSelect<T>(select: Selector<T>, deps: DependencyList = []): T {
    const [ state ] = useContext(EditorContext);
    return useMemo(() => select(state), [state, ...deps]);
}

export function useDispatch(): Dispatch<EditorAction> {
    const value = useContext(EditorContext);
    return value[1];
}