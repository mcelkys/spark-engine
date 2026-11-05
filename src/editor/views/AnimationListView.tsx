import { Fragment, useState, type FC } from "react";
import { useSelect } from "../state";
import { useMutation, useSetter } from "../hooks/state";
import { BottomForm, ButtonGroup, FormHead, FormHeadActions, FormList, H5, Id } from "../styled";
import IconButton from "@mui/material/IconButton";
import Add from "@mui/icons-material/Add";
import Close from "@mui/icons-material/Close";
import ListItem from "@mui/material/ListItem";
import Edit from "@mui/icons-material/Edit";
import Delete from "@mui/icons-material/Delete";
import ListItemText from "@mui/material/ListItemText";
import Divider from "@mui/material/Divider";
import { AnimationDialog } from "./AnimationDialog";

export const AnimationListView: FC = () => {
    const animations = useSelect((state) => state.animationPack?.animations ?? []);
    const setBottomView = useSetter("bottomView");
    const remove = useMutation<[number]>((state, id) => ({
        ...state,
        animationPack: {
            ...state.animationPack!,
            animations: (state.animationPack?.animations ?? []).filter((animation) => animation.id !== id),
        },
    }));
    const [ animation, setAnimation ] = useState<number>();
    
    return (
        <Fragment>
            <BottomForm>
                <FormHead>
                    <H5>Animations</H5>
                    <FormHeadActions>
                        <IconButton onClick={() => setAnimation(animations.reduce((id, ani) => id > ani.id ? id : ani.id + 1, 0))}>
                            <Add />
                        </IconButton>
                        <IconButton onClick={() => setBottomView(undefined)}>
                            <Close />
                        </IconButton>
                    </FormHeadActions>
                </FormHead>
                <FormList>
                    <Divider />
                    {animations.map((animation) => (
                        <Fragment key={animation.id}>
                            <ListItem secondaryAction={
                                <ButtonGroup>
                                    <IconButton onClick={() => setAnimation(animation.id)}>
                                        <Edit />
                                    </IconButton>
                                    <IconButton onClick={() => remove(animation.id)}>
                                        <Delete />
                                    </IconButton>
                                </ButtonGroup>
                            }>
                                <ListItemText primary={
                                    <Fragment>
                                        <Id component="span">{animation.id}</Id>
                                        {animation.name}
                                    </Fragment>
                                } />
                            </ListItem>
                            <Divider />
                        </Fragment>
                    ))}
                </FormList>
            </BottomForm>
            <AnimationDialog key={animation ?? 0} open={typeof animation === "number"} id={animation} onClose={() => setAnimation(undefined)} />
        </Fragment>
    );
};