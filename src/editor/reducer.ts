import { ActionType, type EditorAction, type EditorState } from "./types";

export function reducer(state: EditorState, action: EditorAction): EditorState {
    switch (action.type) {
        case ActionType.MUTATION:
            return action.mutate(state);
    
        default:
            return state;
    }
}