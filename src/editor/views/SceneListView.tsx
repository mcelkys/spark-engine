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
import { BottomForm, ButtonGroup, FormHead, FormHeadActions, FormList, H5, Id } from "../styled";
import { Add, Close, PlayArrow } from "@mui/icons-material";
import { Hide } from "../components/Hide";
import Chip from "@mui/material/Chip";


export const SceneListView: FC = () => {
    const loadedSceneId = useSelect((state) => state.loadedSceneId);
    const scenes = useSelect((state) => state.game?.scenes ?? []);
    const setSideView = useSetter("sideView");
    const setBottomView = useSetter("bottomView");
    const loadScene = useSetter("loadedSceneId");
    const remove = useMutation<[number]>((state, id) => ({
        ...state,
        game: {
            ...state.game!,
            scenes: (state.game?.scenes ?? []).filter((scene) => scene.id !== id)
        },
    }));

    return (
        <BottomForm>
            <FormHead>
                <H5>Scenes</H5>
                <FormHeadActions>
                    <IconButton onClick={() => setSideView({
                        type: SideViewType.SCENE,
                        id: scenes.reduce((id, scene) => id > scene.id ? id : scene.id + 1, 0)
                    })}>
                        <Add />
                    </IconButton>
                    <IconButton onClick={() => setBottomView(undefined)}>
                        <Close />
                    </IconButton>
                </FormHeadActions>
            </FormHead>
            <FormList>
                <Divider />
                {scenes.map((scene) => (
                    <Fragment key={scene.id}>
                        <ListItem secondaryAction={
                            <ButtonGroup>
                                <Hide show={scene.id !== loadedSceneId}>
                                    <IconButton onClick={() => loadScene(scene.id)}>
                                        <PlayArrow />
                                    </IconButton>
                                </Hide>
                                <IconButton onClick={() => setSideView({
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
                                    <Hide show={scene.id === loadedSceneId}>
                                        <Chip label="Currently loaded" sx={(theme) => ({ marginLeft: theme.spacing(2) })} />
                                    </Hide>
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