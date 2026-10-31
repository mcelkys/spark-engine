import { styled } from "@mui/material/styles";
import Box, { type BoxProps } from "@mui/material/Box";
import Typography, { type TypographyProps } from "@mui/material/Typography";
import Avatar, { type AvatarProps } from "@mui/material/Avatar";
import List, { type ListProps } from "@mui/material/List";
import DialogActions, { type DialogActionsProps } from "@mui/material/DialogActions";
import MuiButtonGroup, { type ButtonGroupProps } from "@mui/material/ButtonGroup";

export const H4 = styled(Typography)<TypographyProps>(({ theme }) => ({
    ...theme.typography.h4,
}));

export const H5 = styled(Typography)<TypographyProps>(({ theme }) => ({
    ...theme.typography.h5,
}));

export const H6 = styled(Typography)<TypographyProps>(({ theme }) => ({
    ...theme.typography.h6,
}));

export const StructuralRow = styled(Box)<BoxProps>(({ theme }) => ({
    flex: "1 1 0px",
    display: "flex",
    gap: theme.spacing(1),
    minWidth: 0,
}));

export const StructuralColumn = styled(StructuralRow)<BoxProps>({
    flexDirection: "column",
});

export const Panel = styled(Box)<BoxProps>(({ theme }) => ({
    ...theme.shape,
    backgroundColor: theme.alpha(theme.palette.grey[50], 0.15),
    display: "flex",
    flexDirection: "column",
}));

export const FormPanel = styled(Panel)<BoxProps>(({ theme }) => ({
    paddingTop: theme.spacing(3),
    paddingBottom: theme.spacing(3),
    gap: theme.spacing(3),
}));

export const BottomForm = styled(FormPanel)<BoxProps>({
    maxHeight: "50%",
});

export const SideForm = styled(FormPanel)<BoxProps>({
    maxWidth: "40%",
    minWidth: 500,
});

export const FormHeading = styled(H5)<TypographyProps>(({ theme }) => ({
    paddingLeft: theme.spacing(3),
    paddingRight: theme.spacing(3),
}));

export const FormContainer = styled(Box)<BoxProps>(({ theme }) => ({
    paddingLeft: theme.spacing(3),
    paddingRight: theme.spacing(3),
}));

export const FormHead = styled(FormContainer)<BoxProps>(({ theme }) => ({
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: theme.spacing(3),
}));

export const FormHeadActions = styled(MuiButtonGroup)<ButtonGroupProps>(({ theme }) => ({
    gap: theme.spacing(1),
}));

export const FormBody = styled(FormContainer)<BoxProps>({
    flex: 1,
    overflowY: "auto",
});

export const FormFields = styled(FormBody)<BoxProps>(({ theme }) => ({
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing(3),
    paddingTop: theme.spacing(1),
}));

export const Actions = styled(Box)<BoxProps>(({ theme }) => ({
    display: "flex",
    justifyContent: "flex-end",
    gap: theme.spacing(3),
}));

export const FormAction = styled(Actions)<BoxProps>(({ theme }) => ({
    paddingLeft: theme.spacing(3),
    paddingRight: theme.spacing(3),
}));

export const FormList = styled(List)<ListProps>({
    minHeight: 0,
    overflowY: "auto",
});

export const Spacer = styled(Box)<BoxProps>({
    flex: 1,
});

export const ButtonGroup = styled(Box)<BoxProps>(({ theme }) => ({
    display: "flex",
    gap: theme.spacing(1),
}));

export const Id = styled(Avatar)<AvatarProps>(({ theme }) => ({
    ...theme.typography.subtitle1,
    display: "inline-flex",
    marginRight: theme.spacing(2),
    width: 30,
    height: 30,
    color: theme.palette.primary.light,
    fontWeight: theme.typography.fontWeightBold,
}));

export const DialogButtons = styled(DialogActions)<DialogActionsProps>(({ theme }) => ({
    paddingLeft: theme.spacing(3),
    paddingRight: theme.spacing(3),
    paddingBottom: theme.spacing(3),
}));