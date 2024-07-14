import { useEffect, useRef, useState } from "react";
import SingleState from "../Interfaces/MainState";
import JSZip from "jszip";
interface Props {
    files: SingleState[]
}
interface StateProps {
    downloadUrl?: string,
    compressionEnabled?: boolean,
    reEncode?: boolean,
    imageEncoded?: {
        number: number,
        length: number,
        name: string
    }
}
interface DirectoryPicker {
    id?: string,
    mode?: string
}

declare global {
    interface Window {
        showDirectoryPicker: ({ id, mode }: DirectoryPicker) => Promise<FileSystemDirectoryHandle>,
    }
}
export default function Table({ files }: Props) {
    /**
     * The State that is used to display the currently loaded file. This is done so that the website won't lag if the user chooses lots of images
     */
    const [stateFiles, updateFiles] = useState<SingleState[]>(files.slice(0, +(localStorage.getItem("imageToZip-SuggestedScroll") ?? "25")))
    /**
     * A reference of the State files. This is saved as a reference so that the "saveOutput" property won't be changed when the user adds images
     */
    const fileUpdate = useRef<SingleState[]>(stateFiles);
    /**
     * The compression level of the ZIP file
     */
    const compressionNumber = useRef<number>(1);
    /**
     * The compression level of the image
     */
    const compressionImage = useRef<number>(0.9);
    /**
     * The output image mimetype
     */
    const outputImageFormat = useRef<string>("image/jpeg");
    /**
     * The resize percentage of the output image
     */
    const outputImageResize = useRef<number>(100);
    const [state, updateState] = useState<StateProps>({});
    /**
     * The link to click for downloading the zip file
     */
    let clickRef = useRef<HTMLLinkElement>(null);
    /**
     * Get the output image file, by re-encoding the image if requested by the user
     * @param file the image file
     * @returns a Blob, with the output image file
     */
    function getOutputImage(file: File) {
        return new Promise<Blob>((resolve, reject) => {
            if (!state.reEncode) {
                resolve(file);
                return;
            }
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement("canvas");
                canvas.width = img.width * outputImageResize.current / 100;
                canvas.height = img.height * outputImageResize.current / 100;
                URL.revokeObjectURL(img.src);
                const ctx = canvas.getContext("2d");
                if (ctx) {
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    canvas.toBlob((blob) => {
                        blob ? resolve(blob) : reject();
                    }, outputImageFormat.current, compressionImage.current)
                } else reject();
            }
            img.onerror = () => reject();
            img.src = URL.createObjectURL(file)
        })
    }
    /**
     * Replace the output extension with the correct one after re-encoding
     * @param fileName the file name
     * @returns the correct file name
    */
    function getOutputFileName(fileName: string) {
        return `${fileName.substring(0, fileName.lastIndexOf(".") + 1)}${!state.reEncode ? fileName.substring(fileName.lastIndexOf(".") + 1) : outputImageFormat.current.endsWith("jpeg") ? "jpg" : outputImageFormat.current.substring(outputImageFormat.current.indexOf("/") + 1)}`;
    }
    useEffect(() => {
        for (let i = 0; i < files.length; i++) { // Update the fileUpdate reference with the new items
            if (!fileUpdate.current[i] || files[i].blobUrl !== fileUpdate.current[i].blobUrl) fileUpdate.current[i] = files[i];
        }
    }, [files])
    useEffect(() => {
        state.downloadUrl && clickRef.current?.click();
    }, [state.downloadUrl])
    return <>
        <div className="card" style={{ backgroundColor: "var(--table)" }}>
            <h3>Save options:</h3>
            <div className="card">
                <label className="flex hcenter" style={{ gap: "10px" }}>
                    <input type="checkbox" defaultChecked={state.compressionEnabled} onChange={(e) => updateState(prevState => { return { ...prevState, compressionEnabled: e.target.checked } })}></input>
                    Compress zip file</label>
                {state.compressionEnabled && <>
                    <br></br>
                    <label className="flex hcenter" style={{ gap: "10px", flexDirection: "column" }}>Compression level:
                        <input type="range" min={1} max={9} defaultValue={compressionNumber.current} onInput={(e) => { compressionNumber.current = +(e.target as HTMLSelectElement).value }}></input>
                    </label>
                </>}
            </div>
            <div className="card">
                <label className="flex hcenter" style={{ gap: "10px" }}>
                    <input type="checkbox" defaultChecked={state.reEncode} onChange={(e) => updateState(prevState => { return { ...prevState, reEncode: e.target.checked } })}></input>
                    Re-encode images
                </label>
                {state.reEncode && <>
                    <br></br>
                    <label className="flex hcenter" style={{ gap: "10px" }}>Encode a <select defaultValue={outputImageFormat.current} onChange={(e) => { outputImageFormat.current = e.target.value }}>
                        <option value={"image/jpeg"}>JPEG</option>
                        <option value={"image/png"}>PNG</option>
                        {document.createElement("canvas").toDataURL("image/webp").startsWith("data:image/webp") && <option value={"image/webp"}>WebP</option>}
                    </select>image</label><br></br>
                    <label className="flex hcenter" style={{ gap: "10px", flexDirection: "column" }}>Image quality:
                        <input type="range" step={0.01} min={0.01} max={1} defaultValue={compressionImage.current} onInput={(e) => { compressionImage.current = +(e.target as HTMLSelectElement).value }}></input>
                    </label><br></br>
                    <label className="flex hcenter" style={{ gap: "10px", flexDirection: "column" }}>Resize image width/height (in percentage):
                        <input type="range" step={1} min={1} max={100} defaultValue={outputImageResize.current} onInput={(e) => { outputImageResize.current = +(e.target as HTMLSelectElement).value }}></input>
                    </label>
                </>}</div>
            <br></br>
            <div className="flex" style={{ gap: "10px" }}>
                <button onClick={async () => {
                    const zip = new JSZip();
                    const filter = fileUpdate.current.filter(file => file.saveOutput);
                    for (let i = 0; i < filter.length; i++) {
                        const { file } = filter[i];
                        updateState(prevState => { return { ...prevState, imageEncoded: { name: file.name, number: i, length: filter.length } } });
                        zip.file(getOutputFileName(file.webkitRelativePath || file.name), await getOutputImage(file), { createFolders: true });
                    }
                    const downloadUrl = URL.createObjectURL(await zip.generateAsync({ type: "blob", compression: state.compressionEnabled ? "DEFLATE" : "STORE", compressionOptions: { level: compressionNumber.current } }));
                    updateState(prevState => { return { ...prevState, downloadUrl, imageEncoded: undefined } });
                }}>Create zip file</button>
                {typeof window.showDirectoryPicker !== "undefined" && <button onClick={async () => {
                    const picker = await window.showDirectoryPicker({ id: "ImageToZip-SaveFolder", mode: "readwrite" });
                    const filter = fileUpdate.current.filter(file => file.saveOutput);
                    for (let i = 0; i < filter.length; i++) {
                        const { file } = filter[i];
                        updateState(prevState => { return { ...prevState, imageEncoded: { name: file.name, number: i, length: filter.length } } });
                        let outputPicker = picker;
                        let fileSplit = (file.webkitRelativePath || file.name).split("/");
                        const name = getOutputFileName(fileSplit.pop() ?? file.name);
                        for (const path of fileSplit) outputPicker = await outputPicker.getDirectoryHandle(path, { create: true })
                        const handle = await outputPicker.getFileHandle(name, { create: true });
                        const writable = await handle.createWritable();
                        await writable.write(await getOutputImage(file));
                        await writable.close();
                    }
                    alert("File(s) saved!");
                    updateState(prevState => { return { ...prevState, imageEncoded: undefined } });
                }}>Save on the File System</button>}
            </div>
        </div><br></br>
        {state.imageEncoded && <div className="topDialog">
            <p>Converting image {state.imageEncoded.name} ({state.imageEncoded.number + 1}/{state.imageEncoded.length})</p>
        </div>}
        {state.downloadUrl && <div className="topDialog flex hcenter" style={{ gap: "10px" }}>
            <p>Download started!</p>
            <a ref={clickRef} download={"ImageZip.zip"} href={state.downloadUrl}>Re-download zip</a>
            <p style={{ textDecoration: "underline" }} className="pointer" onClick={() => {
                const url = state.downloadUrl ?? "";
                updateState(prevState => { return { ...prevState, downloadUrl: undefined } });
                URL.revokeObjectURL(url);
            }}>Close this</p>
        </div>}<br></br><br></br>
        <div className="card" style={{ backgroundColor: "var(--table" }}>
            <div style={{ overflow: "auto", maxHeight: "95vh" }} onScroll={(e) => {
                const target = e.target as HTMLDivElement;
                /**
                 * The percentage of the scrolled div
                 */
                const percentage = (target.scrollTop + target.clientHeight) * 100 / target.scrollHeight;
                if (percentage > 90) { // Load new images
                    const availableLength = target.querySelectorAll("tr").length - 1;
                    if (availableLength < 0) return;
                    updateFiles(files.slice(0, availableLength + +(localStorage.getItem("imageToZip-SuggestedScroll") ?? "25")))
                }
            }}>
                <h3>Table:</h3>
                <table>
                    <tbody>
                        <tr style={{ backgroundColor: "var(--background)" }}>
                            <th>Image:</th>
                            <th>Save this:</th>
                            <th>Name:</th>
                        </tr>
                        {stateFiles.map((item, i) => <tr key={`ImageToZip-FileBlob-${item.blobUrl}`}>
                            <td>
                                <img style={{ maxWidth: "40vw", maxHeight: "50vh", borderRadius: "8px" }} src={item.blobUrl} loading="lazy"></img>
                            </td>
                            <td>
                                <input type="checkbox" defaultChecked={fileUpdate.current.find(a => a.blobUrl === item.blobUrl)?.saveOutput ?? item.saveOutput} onChange={(e) => {
                                    fileUpdate.current[i].saveOutput = e.target.checked;
                                }}></input>
                            </td>
                            <td>
                                {item.file.webkitRelativePath || item.file.name}
                            </td>
                        </tr>)}
                    </tbody>
                </table>
            </div>
        </div>

    </>
}