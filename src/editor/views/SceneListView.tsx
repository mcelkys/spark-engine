import { Fragment, type FC } from "react";
import Divider from "@mui/material/Divider";
import ListItem from "@mui/material/ListItem";
import IconButton from "@mui/material/IconButton";
import Edit from "@mui/icons-material/Edit";
import Delete from "@mui/icons-material/Delete";
import ListItemText from "@mui/material/ListItemText";
import { useSelect } from "../state";
import { useMutation, useSetter } from "../hooks/state";
import { SideViewType } from "../types";
import { BottomForm, ButtonGroup, FormHeading, FormList, Id } from "../styled";


export const SceneListView: FC = () => {
    const scenes = useSelect((state) => state.game?.scenes ?? []);
    const setView = useSetter("sideView");
    const remove = useMutation<[number]>((state, id) => ({
        ...state,
        game: {
            ...state.game!,
            scenes: (state.game?.scenes ?? []).filter((scene) => scene.id !== id)
        },
    }));

    return (
        <BottomForm>
            <FormHeading variant="h2">Scenes</FormHeading>
            <FormList>
                <Divider />
                {scenes.map((scene) => (
                    <Fragment key={scene.id}>
                        <ListItem secondaryAction={
                            <ButtonGroup>
                                <IconButton onClick={() => setView({
                                    type: SideViewType.SCENE,
                                    id: scene.id,
                                })}>
                                    <Edit />
                                </IconButton>
                                <IconButton onClick={() => remove(scene.id)}>
                                    <Delete />
                                </IconButton>
                            </ButtonGroup>
                        }>
                            <ListItemText primary={
                                <Fragment>
                                    <Id component="span">{scene.id}</Id>
                                    {scene.name}
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