/**
 * Triggers a download of the given fileUrl with default name fileName.
 */
export default async function download(
    fileUrl: string,
    fileName: string,
): Promise<void> {
    // Fetch the file and turn it into an Object URL
    const response = await fetch(fileUrl);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);

    // Create the `<a href={url} download={fileName} />` element
    const anchor = document.createElement('a');
    anchor.setAttribute('href', url);
    anchor.setAttribute('download', fileName);
    document.body.appendChild(anchor);

    // Trigger the download
    anchor.click();

    // Clean-up
    anchor.remove();
    window.URL.revokeObjectURL(url);
}
