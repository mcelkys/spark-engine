import { Fragment, type FC, type PropsWithChildren } from "react";

export interface HideProps extends PropsWithChildren {
    show?: boolean;
}

export const Hide: FC<HideProps> = ({ show = false, children }) => show ? <Fragment>{children}</Fragment> : null;