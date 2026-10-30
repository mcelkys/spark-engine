import type { FC } from "react";
import { useSelect } from "../state";
import { EditorView } from "../types";
import { GlobalsView } from "./GlobalsView";
import { SceneListView } from "./SceneListView";
import { TemplateListView } from "./TemplateListView";
import { EntityListView } from "./EntityListView";

export const BottomViewSelector: FC = () => {
    const view = useSelect((state) => state.bottomView);

    switch (view) {
        case EditorView.GLOBALS:
            return <GlobalsView />;

        case EditorView.SCENES:
            return <SceneListView />;

        case EditorView.TEMPLATES:
            return <TemplateListView />;

        case EditorView.ENTITIES:
            return <EntityListView />
    
        default:
            return null;
    }
};