import { DataProvider } from './context/DataContext';
import { AppRoutes } from './routes/AppRoutes';

export default function App(){ return <DataProvider><AppRoutes/></DataProvider>; }
