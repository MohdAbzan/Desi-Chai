import "@/App.css";
import Lounge from "@/lounge/Lounge";
import { Toaster } from "@/components/ui/sonner";

function App() {
  return (
    <div className="App">
      <Lounge />
      <Toaster position="top-center" />
    </div>
  );
}

export default App;
