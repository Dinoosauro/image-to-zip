import { useRef } from "react";
import AddFiles from "../Scripts/GetFile";
import SingleState from "../Interfaces/MainState";

interface Props {
    updateFiles: React.Dispatch<React.SetStateAction<SingleState[]>>
}
export default function Picker({ updateFiles }: Props) {
    let chooseFromFolder = useRef<boolean>(false);
    return <>
        <h2>Choose files:</h2>
        <p>You can open every supported image from your browser.</p>
        <label className="flex hcenter" style={{ gap: "10px" }}>
            <input type="checkbox" defaultChecked={chooseFromFolder.current} onChange={(e) => { chooseFromFolder.current = e.target.checked }}></input>
            Choose a folder
        </label><br></br><br></br>
        <button onClick={() => AddFiles({ callback: updateFiles, fromFolder: chooseFromFolder.current })}>Open files</button>
    </>
}