import { Fragment, type FC } from "react";
import { useSelect } from "../state";
import { useMutation, useSetter } from "../hooks/state";
import { BottomForm, ButtonGroup, FormHead, FormHeadActions, FormList, H5, Id } from "../styled";
import IconButton from "@mui/material/IconButton";
import Add from "@mui/icons-material/Add";
import Close from "@mui/icons-material/Close";
import Divider from "@mui/material/Divider";
import Edit from "@mui/icons-material/Edit";
import Delete from "@mui/icons-material/Delete";
import ListItemText from "@mui/material/ListItemText";
import ListItem from "@mui/material/ListItem";
import { SideViewType } from "../types";

export const AnimationCollectionListView: FC = () => {
    const collections = useSelect((state) => state.animationPack?.collections ?? []);
    const setSideView = useSetter("sideView");
    const setBottomView = useSetter("bottomView");
    const remove = useMutation<[number]>((state, id) => ({
        ...state,
        animationPack: {
            ...state.animationPack!,
            collections: (state.animationPack?.collections ?? []).filter((collection) => collection.id !== id)
        },
    }));

    return (
        <BottomForm>
            <FormHead>
                <H5>Animation collections</H5>
                <FormHeadActions>
                    <IconButton onClick={() => setSideView({
                        type: SideViewType.ANIMATION_COLLECTION,
                        id: collections.reduce((id, collection) => id > collection.id ? id : collection.id + 1, 0),
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
                {collections.map((collection) => (
                    <Fragment key={collection.id}>
                        <ListItem secondaryAction={
                            <ButtonGroup>
                                <IconButton onClick={() => setSideView({
                                    type: SideViewType.ANIMATION_COLLECTION,
                                    id: collection.id,
                                })}>
                                    <Edit />
                                </IconButton>
                                <IconButton onClick={() => remove(collection.id)}>
                                    <Delete />
                                </IconButton>
                            </ButtonGroup>
                        }>
                            <ListItemText primary={
                                <Fragment>
                                    <Id component="span">{collection.id}</Id>
                                    {collection.name}
                                </Fragment>
                            }/>
                        </ListItem>
                        <Divider />
                    </Fragment>
                ))}
            </FormList>
        </BottomForm>
    );
};