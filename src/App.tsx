import { ReactScreenRecorder } from "./components"

function App() {

  return (
    <ReactScreenRecorder
      recordCurrentScreenOnly={false}
      onRecordingStop={(data) => {
        console.log({ data })
      }}
    />
  )
}

export default App
