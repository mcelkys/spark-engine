import { Fragment, useMemo, useState, type FC } from "react";
import Divider from "@mui/material/Divider";
import ListItem from "@mui/material/ListItem";
import IconButton from "@mui/material/IconButton";
import Edit from "@mui/icons-material/Edit";
import Delete from "@mui/icons-material/Delete";
import ListItemText from "@mui/material/ListItemText";
import { useSelect } from "../state";
import { useMutation, useSetter } from "../hooks/state";
import { BottomForm, ButtonGroup, FormContainer, FormHead, FormHeadActions, FormList, H5, Id } from "../styled";
import { SideViewType } from "../types";
import { Combobox } from "../components/Combobox";
import Add from "@mui/icons-material/Add";
import { Close } from "@mui/icons-material";

export const EntityListView: FC = () => {
    const activeSceneId = useSelect((state) => state.engine?.scene.id);
    const defaultSceneId = useSelect((state) => state.game?.scene);
    const scenes = useSelect((state) => state.game?.scenes ?? []);
    const templates = useSelect((state) => state.game?.templates ?? []);
    const allEntities = useSelect((state) => state.game?.entities ?? []);
    const setSideView = useSetter("sideView");
    const setBottomView = useSetter("bottomView");
    const options = useMemo(() => new Map(scenes.map((scene) => [scene.id, scene.name])), [scenes]);
    const [selectedId, setSelectedId] = useState(activeSceneId ?? defaultSceneId ?? null);
    const names = useMemo(() => {
        return new Map(templates.map((template) => [template.id, template.name]));
    }, [templates]);
    const entities = useMemo(() => {
        if (selectedId === null) {
            return allEntities;
        }
        return allEntities.filter((entity) => entity.scene === selectedId);
    }, [selectedId, allEntities]);
    const remove = useMutation<[number]>((state, id) => ({
        ...state,
        game: {
            ...state.game!,
            entities: (state.game?.entities ?? []).filter((entity) => entity.id !== id)
        },
        changedEntities: new Set(),
    }));

    return (
        <BottomForm>
            <FormHead>
                <H5 variant="h2">Entities</H5>
                <FormHeadActions>
                    <IconButton onClick={() => setSideView({
                        type: SideViewType.ENTITY,
                        id: allEntities.reduce((id, ent) => id > ent.id ? id : ent.id + 1, 0),
                    })}>
                        <Add />
                    </IconButton>
                    <IconButton onClick={() => setBottomView(undefined)}>
                        <Close />
                    </IconButton>
                </FormHeadActions>
            </FormHead>
            <FormContainer>
                <Combobox
                    label="Filter by scene"
                    value={selectedId}
                    options={options}
                    onChange={setSelectedId}
                />
            </FormContainer>
            <FormList>
                <Divider />
                {entities.map((entity) => (
                    <Fragment key={entity.id}>
                        <ListItem secondaryAction={
                            <ButtonGroup>
                                <IconButton onClick={() => setSideView({
                                    type: SideViewType.ENTITY,
                                    id: entity.id,
                                })}>
                                    <Edit />
                                </IconButton>
                                <IconButton onClick={() => remove(entity.id)}>
                                    <Delete />
                                </IconButton>
                            </ButtonGroup>
                        }>
                            <ListItemText primary={
                                <Fragment>
                                    <Id component="span">{entity.id}</Id>
                                    {names.get(entity.template)}
                                </Fragment>
                            } />
                        </ListItem>
                        <Divider />
                    </Fragment>
                ))}
            </FormList>
        </BottomForm>
    );
};