import SingleState from "../Interfaces/MainState";

interface Props {
    callback: React.Dispatch<React.SetStateAction<SingleState[]>>,
    fromFolder?: boolean
}
export default function AddFiles({ callback, fromFolder }: Props) {
    const file = document.createElement("input");
    file.type = "file";
    file.multiple = true;
    file.accept = "image/*"
    file.webkitdirectory = fromFolder ?? false;
    file.onchange = () => {
        callback((prev) => [...prev, ...Array.from(file.files ?? []).filter(e => e.type.startsWith("image")).map(item => { // Filter the array since, when choosing a folder, also other items are selected
            return {
                file: item,
                blobUrl: URL.createObjectURL(item),
                saveOutput: localStorage.getItem("imageToZip-DefaultChecked") !== "a"
            }
        })]);
    }
    file.click();
}