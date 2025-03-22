import "./App.css";
import CacheMiss from "./components/CacheMiss";
import Batching from "./components/Batching";

function App() {
  return (
    <div className="App">
      "Running the client side of cache app"
      {/* <CacheMiss/> */}
      <Batching />
    </div>
  );
}

export default App;
