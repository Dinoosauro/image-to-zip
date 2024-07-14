import { useEffect, useState } from "react";
import Picker from "./Components/Picker";
import SingleState from "./Interfaces/MainState";
import Table from "./Components/Table";
import AddFiles from "./Scripts/GetFile";
export default function App() {
  const [files, updateFiles] = useState<SingleState[]>([]);
  return <>
    <header>
      <h1 style={{ textAlign: "center" }}>image-to-zip</h1>
    </header>
    <div className="card">
      {files.length === 0 ? <Picker updateFiles={updateFiles}></Picker> : <>
        <div className="flex hcenter" style={{ gap: "10px" }}>
          <button onClick={() => AddFiles({ callback: updateFiles, fromFolder: false })}>Add files</button>
          <button onClick={() => AddFiles({ callback: updateFiles, fromFolder: true })}>Add folder</button>
        </div><br></br>
        <Table files={files}></Table>
      </>}
    </div><br></br><br></br>
    <div className="card">
      <h2>Settings:</h2>
      <div className="card" style={{ backgroundColor: "var(--table)" }}>
        <h3>Image loading:</h3>
        <label className="flex hcenter" style={{ gap: "10px" }}>
          <input type="checkbox" defaultChecked={localStorage.getItem("imageToZip-DefaultChecked") !== "a"} onChange={(e) => localStorage.setItem("imageToZip-DefaultChecked", e.target.checked ? "b" : "a")}></input>
          Add items to download list by default
        </label><br></br>
        <label className="flex hcenter" style={{ gap: "10px" }}>
          Load by default:
          <input type="number" defaultValue={localStorage.getItem("imageToZip-SuggestedScroll") ?? "25"} onInput={(e) => localStorage.setItem("imageToZip-SuggestedScroll", (e.target as HTMLInputElement).value)}></input>
          images
        </label>
      </div>
      <div className="card" style={{ backgroundColor: "var(--table)" }}>
        <h3>Credits:</h3>
        <a style={{ marginRight: "10px" }} href={window.location.href} target="_blank" download={"image-to-zip.html"}>Download webpage for offline usage</a>
        <a href="https://github.com/dinoosauro/image-to-zip" target="_blank">View on GitHub</a><br></br><br></br>
        <p>Powered by <a target="_blank" href="https://github.com/facebook/react?tab=MIT-1-ov-file#readme">React</a> and the <a target="_blank" href="https://github.com/Stuk/jszip?tab=License-1-ov-file#readme">JSZip library</a>.</p>
      </div>
    </div>
  </>
}