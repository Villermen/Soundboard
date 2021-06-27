import { Sample } from '../api';

interface PlayingData {
    audioElements: HTMLAudioElement[];
    analyserNode: AnalyserNode;
}

/**
 * Stops (pauses) all audio elements related to the given PlayingData.
 */
function stop(playingData: PlayingData) {
    playingData.audioElements.forEach((audioElement) => {
        audioElement.pause();
    });
}

export interface TogglePlayOptions {
    spam?: boolean;
    loop?: boolean;
}

export default class Player {
    private audioContext: AudioContext;
    private gainNode: GainNode;

    private playing: Map<string, PlayingData> = new Map();

    constructor() {
        this.audioContext = new AudioContext();

        // Create gain node
        this.gainNode = this.audioContext.createGain();
        this.gainNode.connect(this.audioContext.destination);
        // TODO: add user setting for volume
        this.gainNode.gain.value = 0.1;
    }

    /**
     * Returns whether the sample with the given key is currently playing.
     */
    isPlaying(key: string): boolean {
        return this.playing.has(key);
    }

    /**
     * Returns the current progresses of each playing instance of the sample with
     * the given key, or [] if the sample is not currently playing.
     */
    getProgresses(key: string): number[] {
        const playingData = this.playing.get(key);
        if (playingData) {
            return playingData.audioElements.map(
                (audioElement) =>
                    audioElement.currentTime / audioElement.duration,
            );
        }
        return [];
    }

    /**
     * Returns the AnalyserNode for the sample with the given key, or null if
     * the sample is not currently playing. All playing instances of the sample
     * feed into the same AnalyserNode.
     */
    getAnalyserNode(key: string): AnalyserNode | null {
        return this.playing.get(key)?.analyserNode ?? null;
    }

    /**
     * Stops all playing instances of the sample with the given key.
     */
    stop(key: string) {
        const playingData = this.playing.get(key);
        if (playingData) {
            stop(playingData);
        }
    }

    /**
     * Stops all playing instances of all playing samples.
     */
    stopAll() {
        this.playing.forEach(stop);
    }

    /**
     * Toggles playing the given sample.
     *
     * The interaction of the `spam` option and the current playing state of the
     * sample is as follows:
     * - !spam && !playing => stop all samples, start playing the given sample
     * - !spam && playing => stop playing the given sample
     * - spam => start playing the given sample
     *
     * The `loop` option will simply set the new playing instance (be it spammed
     * or not) to loop indefinitely.
     */
    async togglePlay(
        { key, url }: Sample,
        { spam = false, loop = false }: TogglePlayOptions = {},
    ) {
        // No need to stop anything when spamming
        if (!spam) {
            if (this.isPlaying(key)) {
                player.stop(key);
                return;
            }
            player.stopAll();
        }

        // Resume context if it is suspended due to a lack of user input
        // Not awaited because that makes it hang indefinitely on Chrome on
        // Android...
        this.audioContext.resume();

        // Use existing analyser node or create a new one if this sample isn't
        // already playing.
        let analyserNode = this.getAnalyserNode(key);
        if (analyserNode === null) {
            analyserNode = this.audioContext.createAnalyser();
            analyserNode.fftSize = 2048;
            analyserNode.connect(this.gainNode);
        }

        const audio = new Audio(url);
        audio.crossOrigin = 'anonymous';
        audio.loop = loop;
        const source = this.audioContext.createMediaElementSource(audio);
        source.connect(analyserNode);

        const handleStop = () => {
            const playingData = this.playing.get(key);
            if (!playingData) {
                return;
            }

            // Unload the audio file
            audio.removeAttribute('src');
            audio.load();

            // Remove this audio element from the list
            playingData.audioElements = playingData.audioElements.filter(
                (other) => other !== audio,
            );

            // Sample only fully ends once there are no more playing instances
            if (playingData.audioElements.length === 0) {
                this.playing.delete(key);
                this.emit('ended', key);
            }
        };

        audio.addEventListener('pause', handleStop);
        audio.addEventListener('ended', handleStop);

        await audio.play();

        // "Emplace" playingData with new audio element appended to the list
        const playingData = this.playing.get(key) ?? {
            audioElements: [],
            analyserNode,
        };
        playingData.audioElements.push(audio);
        this.playing.set(key, playingData);

        this.emit('play', key);
        this.watchProgressStart();
    }

    // Watch progress stuff
    private watchProgressRequestId: number | null = null;

    private watchProgressStart() {
        if (this.watchProgressRequestId === null) {
            this.watchProgressRequestId = window.requestAnimationFrame(
                this.watchProgress,
            );
        }
    }

    private watchProgress = () => {
        if (this.playing.size === 0) {
            this.watchProgressRequestId = null;
            return;
        }

        this.playing.forEach((playingData, key) => {
            // TODO: Add current progress as event argument
            this.emit('progress', key);
        });

        this.watchProgressRequestId = window.requestAnimationFrame(
            this.watchProgress,
        );
    };

    // Event stuff
    private eventTarget = new EventTarget();

    on(eventName: string, key: string, listener: any) {
        this.eventTarget.addEventListener(`${eventName} ${key}`, listener);
    }

    off(eventName: string, key: string, listener: any) {
        this.eventTarget.removeEventListener(`${eventName} ${key}`, listener);
    }

    private emit(eventName: string, key: string) {
        this.eventTarget.dispatchEvent(new Event(`${eventName} ${key}`));
    }
}

export const player = new Player();
