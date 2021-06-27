import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import cx from 'classnames';
import React from 'react';

interface OwnProps {
    icon: IconProp;
    kind: 'search' | 'header';
    innerRef?: React.ForwardedRef<HTMLButtonElement>;
}

export type IconButtonProps = OwnProps &
    React.ComponentPropsWithoutRef<'button'>;

export default function IconButton({
    icon,
    kind,
    innerRef,
    ...otherProps
}: IconButtonProps) {
    return (
        <button
            ref={innerRef}
            className={cx('IconButton', `IconButton--${kind}`)}
            {...otherProps}
        >
            <FontAwesomeIcon icon={icon} />
        </button>
    );
}
