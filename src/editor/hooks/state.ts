import { useDispatch } from "../state";
import { ActionType, type EditorState } from "../types";

export type Mutation<A extends unknown[]> = (state: EditorState, ...args: A) => EditorState;
export type Mutator<A extends unknown[]> = (...args: A) => void;
export type Setter<K extends keyof EditorState> = Mutator<[EditorState[K]]>;

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