import { DataProvider } from "./pages/DataContext";
import AppRoutes from "./routes";
import './App.css';

function App() {
  return (
    <DataProvider>
        <AppRoutes /> 
    </DataProvider>
  )
}

export default App;
