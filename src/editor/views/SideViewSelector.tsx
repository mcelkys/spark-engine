import type { FC } from "react";
import { useSelect } from "../state";
import { SideViewType } from "../types";
import { SceneView } from "./SceneView";
import { TemplateView } from "./TemplateView";
import { EntityView } from "./EntityView";

export const SideViewSelector: FC = () => {
    const view = useSelect((state) => state.sideView);

    switch (view?.type) {
        case SideViewType.SCENE:
            return <SceneView key={view.id} id={view.id} />;

        case SideViewType.TEMPLATE:
            return <TemplateView key={view.id} id={view.id} />;

        case SideViewType.ENTITY:
            return <EntityView key={view.id} id={view.id} />
    
        default:
            return null;
    }
};