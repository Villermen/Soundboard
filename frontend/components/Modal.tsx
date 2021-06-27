import React from 'react';

interface ModalOwnProps {
    innerRef?: React.ForwardedRef<HTMLDivElement>;
    arrowProps?: React.ComponentPropsWithRef<'div'>;
}

type ModalProps = ModalOwnProps & React.ComponentPropsWithoutRef<'div'>;

export default function Modal({
    children,
    innerRef,
    arrowProps,
    ...otherProps
}: ModalProps): JSX.Element {
    return (
        <div ref={innerRef} className="Modal" role="dialog" {...otherProps}>
            {arrowProps && <div className="Modal__arrow" {...arrowProps} />}
            <div className="Modal__content">{children}</div>
        </div>
    );
}

type ModalLayerProps = React.ComponentPropsWithoutRef<'div'>;

export function ModalLayer(props: ModalLayerProps): JSX.Element {
    return <div className="ModalLayer" {...props} />;
}
