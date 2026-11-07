import { useDispatch } from "../state";
import { ActionType, type EditorFlags, type EditorState } from "../types";

export type Mutation<A extends unknown[]> = (state: EditorState, ...args: A) => EditorState;
export type Mutator<A extends unknown[]> = (...args: A) => void;
export type Setter<K extends keyof EditorState> = Mutator<[EditorState[K]]>;
export type FlagSetter<F extends keyof EditorFlags> = Mutator<[EditorFlags[F]]>;

export function useMutation<A extends unknown[]>(mutate: Mutation<A>): Mutator<A> {
    const dispatch = useDispatch();
    return (...args) => dispatch({
        type: ActionType.MUTATION,
        mutate: (state) => mutate(state, ...args),
    });
}

export function useSetter<K extends keyof EditorState>(key: K): Setter<K> {
    return useMutation((state, value) => ({ ...state, [key]: value }));
}

export function useFlagSetter<F extends keyof EditorFlags>(flag: F): FlagSetter<F> {
    return useMutation((state, value) => ({ 
        ...state,
        flags: {
            ...state.flags,
            [flag]: value,
        },
    }));
}