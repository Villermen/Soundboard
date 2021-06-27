import { apiBaseUrl } from './config';

export interface Sample {
    // from server
    path: string;
    name: string;
    id: string;
    mtime: number;
    categories: string[];

    // added on client
    key: string;
    url: string;
}

export async function fetchSamples(): Promise<Sample[]> {
    const url = `${apiBaseUrl}/samples`;

    // TODO: Remove 'force-cache'
    const res = await fetch(url, { cache: 'force-cache' });
    if (res.status !== 200) {
        throw new Error(`Server replied with ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    return data.samples.map((sampleData: any) => ({
        ...sampleData,
        mtime: sampleData.mtime * 1000,
        key: sampleData.path,
        url: `${url}/${sampleData.path}`,
    }));
}
