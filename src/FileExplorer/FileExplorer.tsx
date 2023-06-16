import { ChevronRight } from "lucide-react";
import React, { createContext, useContext, useEffect, useState } from "react";
import { cn } from "../lib";

type Folder = {
  title: string;
  childrens?: Array<Folder>;
};

type CollapsibleFolder = {
  title: string;
  open: boolean;
  path: string[];
  childrens?: CollapsibleFolder[];
};

type FileExplorerRoot = Omit<CollapsibleFolder, "title" | "path"> & {
  title: "__root__";
  path: [];
};

type FileExplorerContext = {
  root: FileExplorerRoot;
  setRoot: React.Dispatch<React.SetStateAction<FileExplorerRoot>>;
  activeFolder: CollapsibleFolder;
  setActiveFolder: React.Dispatch<React.SetStateAction<CollapsibleFolder>>;
  history: CollapsibleFolder[];
  setHistory: React.Dispatch<React.SetStateAction<CollapsibleFolder[]>>;
};

const FileExplorerContext = createContext<FileExplorerContext>({} as FileExplorerContext);

const useFileExplorerContext = () => useContext(FileExplorerContext);

const TreeFolder = ({ folder }: { folder: CollapsibleFolder }) => {
  const { setRoot, root } = useFileExplorerContext();

  const isFile = folder.childrens === undefined;
  const isFolder = !isFile;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isFolder) return;

    //Since state changes based on ref equality and root is a dummy fake folder,
    //we can shallow clone root and mutate curr folder's state and
    //setRoot(shallowClonedRoot) to avoid cloning the entire tree which is expensive and will cause issues
    const clonedRoot = { ...root };
    folder.open = !folder.open;

    setRoot(clonedRoot);
  };

  return (
    <div>
      <button className="flex w-full items-center gap-1" onClick={handleClick}>
        {isFolder && (
          <ChevronRight
            className={cn(
              "transition text-neutral-500 aspect-square w-4 h-auto",
              folder.open && "rotate-90 text-neutral-300"
            )}
          />
        )}
        {folder.title}
      </button>
      {folder.childrens && folder.open && (
        <ul>
          {folder.childrens.map((subFolder) => {
            return (
              <li className="pl-4 border-l border-l-red-500" key={subFolder.title}>
                <TreeFolder folder={subFolder} />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

const TreeView = () => {
  const { root } = useFileExplorerContext();

  return (
    <div className="border-l border-l-red-500 pl-4">
      {root.childrens?.map((file) => {
        return <TreeFolder key={file.title} folder={file} />;
      })}
    </div>
  );
};

function* traverseFromPath(root: CollapsibleFolder, path: string[]) {
  let curr: CollapsibleFolder = root;

  for (const key of path) {
    if (!curr.childrens) return;

    const nextFolder = curr.childrens.find((folder) => folder.title === key);

    if (!nextFolder) return;

    curr = nextFolder;
    yield curr;
  }
}

const IconFolder = ({ folder }: { folder: CollapsibleFolder }) => {
  const { root, setRoot, setActiveFolder, setHistory } = useFileExplorerContext();

  const handleClick = () => {
    const clonedRoot = { ...root };

    for (const subFolder of traverseFromPath(clonedRoot, folder.path)) {
      subFolder.open = true;
    }

    setActiveFolder(folder);
    setRoot(clonedRoot);
    setHistory((prevActiveFolder) => [...prevActiveFolder, folder]);
  };

  return (
    <div className="w-24 aspect-[5/6] p-2 h-auto flex flex-col gap-1" onDoubleClick={handleClick}>
      <div className="h-full w-full bg-yellow-300"></div>
      <p className="pl-1 truncate max-w-full" title={folder.title}>
        {folder.title}
      </p>
    </div>
  );
};

const IconView = () => {
  const { activeFolder } = useFileExplorerContext();

  return (
    <div className="w-full h-full bg-neutral-800 rounded">
      <div className="p-2 flex flex-wrap gap-4">
        {activeFolder.childrens?.length ? (
          activeFolder.childrens.map((folder) => {
            return <IconFolder folder={folder} key={folder.title} />;
          })
        ) : (
          <div className="w-full h-full flex items-center justify-center">Folder is empty</div>
        )}
      </div>
    </div>
  );
};

const toCollapsibleFolder = (file: Folder, parentPath = [] as string[], defaultOpen = false): CollapsibleFolder => {
  const collapsible: CollapsibleFolder = {
    ...file,
    path: [...parentPath, file.title],
    childrens: undefined,
    open: defaultOpen,
  };

  let childrens: CollapsibleFolder["childrens"];
  if (file.childrens) {
    childrens = [];
    collapsible.childrens = childrens;

    for (const subFile of file.childrens) {
      childrens.push(toCollapsibleFolder(subFile, collapsible.path));
    }
  }

  return collapsible;
};

const makeRoot = (files: Folder[]) => {
  const title = "__root__" as const;
  const childrens = files.map((subFile) => toCollapsibleFolder(subFile));

  const root = { title, open: true, path: [], childrens } satisfies FileExplorerRoot;

  return root as FileExplorerRoot;
};

const FileExplorer = ({ files: passedFiles }: { files: Array<Folder> }) => {
  // Create a structure to control each folder's state from this main parent component
  // Alternatively, each folder could store its own state but then it we wont be able to
  // change y folder's state from x folder and vice versa
  const [root, setRoot] = useState(makeRoot(passedFiles));
  const [activeFolder, setActiveFolder] = useState<CollapsibleFolder>(root);
  const [history, setHistory] = useState<CollapsibleFolder[]>([]);

  //Recreate root if passed files change
  useEffect(() => {
    //Todo maintain prev state for files that dont change
    setRoot(makeRoot(passedFiles));
  }, [passedFiles]);

  return (
    <FileExplorerContext.Provider value={{ root, setRoot, activeFolder, setActiveFolder, history, setHistory }}>
      <div className="flex items-center h-screen">
        <div className="w-96 h-full py-20 px-4">
          <TreeView />
        </div>
        <div className="w-full h-full py-20">
          <IconView />
        </div>
      </div>
    </FileExplorerContext.Provider>
  );
};

export default FileExplorer;
