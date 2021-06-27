import React, { useContext, useState } from 'react';
import ReactDOM from 'react-dom';
import { usePopper } from 'react-popper';
import useKeydown from '../hooks/useKeydown';

import { SearchContext } from './App';
import IconButton, { IconButtonProps } from './IconButton';
import Modal, { ModalLayer } from './Modal';
import ThemeSelect from './ThemeSelect';

function SearchBar() {
    const { query, setQuery } = useContext(SearchContext);

    return (
        <div className="SearchBar">
            <input
                name="query"
                className="SearchBar__input"
                type="search"
                value={query}
                placeholder="Cook, Search, Delicious!"
                onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
                <div className="SearchBar__clear">
                    <IconButton
                        onClick={() => setQuery('')}
                        kind="search"
                        icon="times"
                        title="Clear input"
                    />
                </div>
            )}
        </div>
    );
}

interface ModalIconButtonProps extends Omit<IconButtonProps, 'innerRef'> {
    children: React.ReactNode;
}

function ModalIconButton({
    children,
    ...iconButtonProps
}: ModalIconButtonProps) {
    const [isOpen, setOpen] = useState(false);

    // Close the modal when the user presses the Escape key
    useKeydown('Escape', () => setOpen(false), isOpen);

    const [referenceElement, setReferenceElement] =
        useState<HTMLButtonElement | null>(null);
    const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(
        null,
    );
    const [arrowElement, setArrowElement] = useState<HTMLDivElement | null>(
        null,
    );

    const { styles, attributes } = usePopper(referenceElement, popperElement, {
        placement: 'bottom',
        modifiers: [
            { name: 'arrow', options: { element: arrowElement } },
            { name: 'preventOverflow', options: { padding: 10 } },
        ],
    });

    return (
        <>
            <IconButton
                {...iconButtonProps}
                innerRef={setReferenceElement}
                onClick={() => {
                    setOpen(!isOpen);
                }}
            />
            {isOpen &&
                ReactDOM.createPortal(
                    <ModalLayer
                        onMouseDown={(e) => {
                            // Close when ModalLayer is pressed
                            if (e.target === e.currentTarget) {
                                setOpen(false);
                            }
                        }}
                    >
                        <Modal
                            innerRef={setPopperElement}
                            arrowProps={{
                                ref: setArrowElement,
                                style: styles.arrow,
                            }}
                            style={styles.popper}
                            {...attributes.popper}
                        >
                            {children}
                        </Modal>
                    </ModalLayer>,
                    document.querySelector('#root') as HTMLDivElement,
                )}
        </>
    );
}

export default function Header() {
    return (
        <>
            <header className="Header">
                <h1 className="Header__title">Soundboard</h1>
                <div className="Header__search">
                    <SearchBar />
                </div>
                <div className="Header__buttons">
                    <ModalIconButton
                        icon="palette"
                        kind="header"
                        title="Change theme"
                    >
                        <ThemeSelect />
                    </ModalIconButton>
                    <ModalIconButton
                        icon="volume-up"
                        kind="header"
                        title="Change volume"
                    >
                        Change volume
                    </ModalIconButton>
                    <IconButton
                        icon="plus-square"
                        kind="header"
                        title="Request a sample"
                    />
                </div>
            </header>
            <div className="Header__pusher" />
        </>
    );
}
