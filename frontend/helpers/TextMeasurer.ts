import { useEffect, useMemo, useState } from 'react';

export default class TextMeasurer {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;

    private widthCache: Record<string, number> = {};

    constructor(font: string) {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d') as CanvasRenderingContext2D;
        this.setFont(font);
    }

    setFont(font: string) {
        this.widthCache = {};
        this.ctx.font = font;
    }

    measureWidth(text: string): number {
        if (text in this.widthCache) {
            return this.widthCache[text];
        }

        const { width } = this.ctx.measureText(text);
        this.widthCache[text] = width;
        return width;
    }
}

export function useFontReady(font: string): boolean {
    const [fontReady, setFontReady] = useState(() =>
        // @ts-ignore
        document.fonts.check(font),
    );
    useEffect(() => {
        // @ts-ignore
        document.fonts.load(font).then(() => {
            setFontReady(true);
        });
    }, [font]);
    return fontReady;
}

export function useTextMeasurer(font: string): TextMeasurer {
    const fontReady = useFontReady(font);
    return useMemo(() => new TextMeasurer(font), [font, fontReady]);
}
