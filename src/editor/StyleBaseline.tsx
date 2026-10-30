import CssBaseline from "@mui/material/CssBaseline";
import GlobalStyles from "@mui/material/GlobalStyles";
import { Fragment, type FC } from "react";

export const StyleBaseline: FC = () => (
    <Fragment>
        <CssBaseline />
        <GlobalStyles styles={(theme) => ({
            body: {
                display: "flex",
                flexDirection: "row",
                padding: theme.spacing(1),
                gap: theme.spacing(1),
            }
        })} />
    </Fragment>

);