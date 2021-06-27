import React, {
    MouseEvent,
    MouseEventHandler,
    ReactNode,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react';
import ReactDOM from 'react-dom';
import { usePopper } from 'react-popper';
import useKeydown from "../hooks/useKeydown";

interface ContextMenuProps {
    children(props: { onContextMenu: MouseEventHandler<any> }): ReactNode;

    items: ItemProps[];
}

export default function ContextMenu(props: ContextMenuProps) {
    const [open, setOpen] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const onContextMenu = useCallback(
        (e: MouseEvent<any>) => {
            e.preventDefault();
            setOpen((open) => !open);
            setPosition({ x: e.clientX, y: e.clientY });
        },
        [setOpen],
    );

    // Close the context menu when the user presses the Escape key
    useKeydown('Escape', () => setOpen(false), open);

    // Popper
    const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(
        null,
    );
    const virtualReference = useMemo(
        () => ({
            getBoundingClientRect() {
                return {
                    top: position.y,
                    left: position.x,
                    right: position.x,
                    bottom: position.y,
                    width: 0,
                    height: 0,
                };
            },
        }),
        [position],
    );
    const { styles, attributes } = usePopper(virtualReference, popperElement, {
        placement: 'bottom-start',
        strategy: 'fixed',
    });

    return (
        <>
            {props.children({ onContextMenu })}
            {open &&
                ReactDOM.createPortal(
                    <div
                        className="ContextMenuLayer"
                        onClick={() => setOpen(false)}
                    >
                        <div
                            ref={setPopperElement}
                            style={styles.popper}
                            {...attributes.popper}
                        >
                            <Menu
                                items={props.items}
                                closeMenu={() => {
                                    setOpen(false);
                                }}
                            />
                        </div>
                    </div>,
                    document.getElementById('root') as HTMLDivElement,
                )}
        </>
    );
}

interface MenuProps {
    items: ItemProps[];
    closeMenu: () => void;
}

function Menu({ items, closeMenu }: MenuProps) {
    return (
        <div
            role="menu"
            className="ContextMenu"
            onClick={(e) => {
                e.stopPropagation();
            }}
        >
            <ul className="ContextMenu__items">
                {items.map((item, index) => (
                    <li key={index} className="ContextMenu__item">
                        <Item
                            {...item}
                            autoFocus={index === 0}
                            onClick={(e) => {
                                item.onClick?.(e);
                                closeMenu();
                            }}
                        />
                    </li>
                ))}
            </ul>
        </div>
    );
}

interface ItemProps extends React.ComponentPropsWithoutRef<'button'> {
    title: string;
    shortcut?: string;
}

function Item({ title, shortcut, ...otherProps }: ItemProps) {
    return (
        <button role="menuitem" className="ContextMenuItem" {...otherProps}>
            <span className="ContextMenuItem__title">{title}</span>
            <span className="ContextMenuItem__shortcut">{shortcut}</span>
        </button>
    );
}
