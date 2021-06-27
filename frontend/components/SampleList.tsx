import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, {
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react';
import { List, WindowScroller } from 'react-virtualized';

import { fetchSamples, Sample } from '../api';
import { useTextMeasurer } from '../helpers/TextMeasurer';
import {
    detailFont,
    nameFont,
    sampleHeight,
    sampleListPadding,
    sampleMargin,
    samplePaddingX,
} from '../styles/sync-variables';
import { SearchContext } from './App';
import SampleItem from './SampleItem/SampleItem';

/**
 * React hook. Fetches samples from API, if needed.
 */
function useSamples(): Sample[] {
    const [samples, setSamples] = useState<Sample[]>([]);

    useEffect(() => {
        fetchSamples().then((samples) => {
            // Sort samples
            const sortLimit = new Date().getTime() - 14 * 24 * 60 * 60 * 1000;
            samples = samples.sort((sample1, sample2) => {
                if (sample1.mtime > sortLimit || sample2.mtime > sortLimit) {
                    return sample2.mtime - sample1.mtime;
                }

                return 2 * Math.floor(2 * Math.random()) - 1;
            });

            setSamples(samples);
        });
    }, []);

    return samples;
}

/**
 * React hook. Filters a list of samples using the given query.
 */
function useFilteredSamples(samples: Sample[], query: string): Sample[] {
    // Only word- and whitespace-chars are allowed in the indices and query
    const ALLOWED_CHARS_REGEX = /[^\w\s]/g;

    // Prepare the normalized sample index. The sample don't generally change,
    // so most of the time we only have to do this once.
    //
    // Example:
    // { name: 'tof', categories: ['voice', 'skik'] } => 'tof voice skik'
    const indexedSamples = useMemo(() => {
        return samples.map((sample) => {
            let string = sample.name.replace(ALLOWED_CHARS_REGEX, '');
            sample.categories.forEach((category) => {
                string += ' ' + category.replace(ALLOWED_CHARS_REGEX, '');
            });
            return string.toLowerCase();
        });
    }, [samples]);

    return useMemo(() => {
        // Normalize the query to match the prepared sample indices
        const normalizedQuery = query
            .replace(ALLOWED_CHARS_REGEX, '')
            .toLowerCase()
            .trim();

        // Early return for empty queries
        if (normalizedQuery === '') {
            return samples;
        }

        // Split the query into an array of terms
        const terms = normalizedQuery.split(/[\s+&]+/g);

        return samples.filter((sample, index) => {
            // Every term must be included in the sample text
            return terms.every((term) => indexedSamples[index].includes(term));
        });
    }, [samples, indexedSamples, query]);
}

/**
 * React hook. Measures the rendered width of each sample in the given list of samples.
 */
function useSampleWidths(samples: Sample[]): number[] {
    const nameMeasurer = useTextMeasurer(nameFont);
    const detailMeasurer = useTextMeasurer(detailFont);

    const getWidth = useCallback(
        (sample: Sample): number =>
            sampleMargin * 2 +
            samplePaddingX * 2 +
            Math.max(
                nameMeasurer.measureWidth(sample.name),
                detailMeasurer.measureWidth(sample.categories.join(' / ')),
            ),
        [nameMeasurer, detailMeasurer],
    );

    return useMemo(() => samples.map(getWidth), [samples, getWidth]);
}

function computeLayout(itemWidths: number[], maxRowWidth: number): number[][] {
    if (itemWidths.length === 0) {
        return [];
    }

    // TODO: Better layout computation. Perhaps do local search (with badness like LaTeX) after the current greedy approach.
    let rows: number[][] = [[]];
    let rowWidth = 0;
    for (let itemIndex = 0; itemIndex < itemWidths.length; ++itemIndex) {
        if (rowWidth === 0 || rowWidth + itemWidths[itemIndex] < maxRowWidth) {
            rowWidth += itemWidths[itemIndex];
            rows[rows.length - 1].push(itemIndex);
        } else {
            rowWidth = itemWidths[itemIndex];
            rows.push([itemIndex]);
        }
    }
    return rows;
}

/**
 * React hook. Measures the width of the body element.
 */
function useBodyWidth(): number {
    const [width, setWidth] = useState(document.body.clientWidth);

    useEffect(() => {
        function handleResize() {
            setWidth(document.body.clientWidth);
        }

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return width;
}

export default function SampleList() {
    const allSamples = useSamples();
    const { query } = useContext(SearchContext);
    const samples = useFilteredSamples(allSamples, query);

    const containerWidth = useBodyWidth() - sampleListPadding * 2;
    const rowHeight = sampleHeight + sampleMargin * 2;

    const widths = useSampleWidths(samples);
    const layout = computeLayout(widths, containerWidth);

    return (
        <WindowScroller>
            {({ height, isScrolling, onChildScroll, scrollTop }) => (
                <List
                    className="SampleList"
                    tabIndex={null}
                    width={containerWidth}
                    height={height}
                    autoHeight
                    isScrolling={isScrolling}
                    onScroll={onChildScroll}
                    scrollTop={scrollTop}
                    rowHeight={rowHeight}
                    rowCount={layout.length}
                    rowRenderer={({ index: rowIndex, style }) => (
                        <div
                            key={rowIndex}
                            className="SampleList__row"
                            style={style}
                            role="row"
                        >
                            {layout[rowIndex].map((index) => {
                                const sample = samples[index];
                                return (
                                    <SampleItem
                                        key={sample.key}
                                        sample={sample}
                                    />
                                );
                            })}
                            {rowIndex === layout.length - 1 && (
                                <div className="SampleList__pusher" />
                            )}
                        </div>
                    )}
                    noRowsRenderer={() => (
                        <div className="SampleList__noResults">
                            <FontAwesomeIcon
                                className="SampleList__noResultsIcon"
                                icon="search"
                                size="2x"
                            />
                            <span className="SampleList__noResultsLabel">
                                How about searching for samples that do exist?
                            </span>
                        </div>
                    )}
                />
            )}
        </WindowScroller>
    );
}
