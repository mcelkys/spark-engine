import type { Engine } from "../engine";
import type { AssetMetadata, SpriteMetadata } from "../types/assets";
import type { Game } from "../types/game";

export interface EditorState {
    game?: Game;
    device?: GPUDevice;
    sprites?: SpriteMetadata;
    assets?: AssetMetadata[];
    texture?: ImageBitmap;
    engine?: Engine;
    bottomView?: EditorView;
    sideView?: SideView;
    changedEntities?: Set<number>;
}

export enum EditorView {
    GLOBALS,
    SCENES,
    TEMPLATES,
    KEY_BINDINGS,
    ENTITIES,
}

export enum SideViewType {
    SCENE,
    TEMPLATE,
    ENTITY,
}

export interface BaseSideView {
    type: SideViewType;
    id: number;
}

export interface GenericSideView extends BaseSideView {
    type: SideViewType.SCENE | SideViewType.TEMPLATE | SideViewType.ENTITY;
}

export type SideView = GenericSideView;

export enum ActionType {
    MUTATION,
}

export interface Action {
    type: ActionType;
}

export interface MutationAction extends Action {
    type: ActionType.MUTATION;
    mutate: (state: EditorState) => EditorState;
}

export type EditorAction = MutationAction;