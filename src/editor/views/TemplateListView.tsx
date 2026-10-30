import { Fragment, type FC } from "react";
import Divider from "@mui/material/Divider";
import ListItem from "@mui/material/ListItem";
import IconButton from "@mui/material/IconButton";
import Edit from "@mui/icons-material/Edit";
import Delete from "@mui/icons-material/Delete";
import ListItemText from "@mui/material/ListItemText";
import { useSelect } from "../state";
import { useMutation, useSetter } from "../hooks/state";
import { BottomForm, ButtonGroup, FormHeading, FormList, Id } from "../styled";
import { SideViewType } from "../types";


export const TemplateListView: FC = () => {
    const templates = useSelect((state) => state.game?.templates ?? []);
    const setView = useSetter("sideView");
    const remove = useMutation<[number]>((state, id) => ({
        ...state,
        game: {
            ...state.game!,
            templates: (state.game?.templates ?? []).filter((template) => template.id !== id)
        },
    }));

    return (
        <BottomForm>
            <FormHeading variant="h2">Templates</FormHeading>
            <FormList>
                <Divider />
                {templates.map((template) => (
                    <Fragment key={template.id}>
                        <ListItem secondaryAction={
                            <ButtonGroup>
                                <IconButton onClick={() => setView({
                                    type: SideViewType.TEMPLATE,
                                    id: template.id,
                                })}>
                                    <Edit />
                                </IconButton>
                                <IconButton onClick={() => remove(template.id)}>
                                    <Delete />
                                </IconButton>
                            </ButtonGroup>
                        }>
                            <ListItemText primary={
                                <Fragment>
                                    <Id component="span">{template.id}</Id>
                                    {template.name}
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