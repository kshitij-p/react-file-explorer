import FileExplorer from "./FileExplorer/FileExplorer";

const fileData = [
  {
    title: "android",
    childrens: [
      {
        title: "app",
        childrens: [
          {
            title: "src",
            childrens: [
              {
                title: "components",
              },
              {
                title: "utils",
              },
            ],
          },
          {
            title: "res",
            childrens: [
              {
                title: "drawable",
              },
              {
                title: "layout",
              },
            ],
          },
        ],
      },
      {
        title: "settings.gradle",
      },
    ],
  },
];

function App() {
  return (
    <div>
      <FileExplorer files={fileData} />
    </div>
  );
}

export default App;
