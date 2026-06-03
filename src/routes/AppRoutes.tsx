import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { AppLayout } from '../layouts/AppLayout';
import { Home } from '../pages/Home';
import { Dashboard } from '../pages/Dashboard';
import { Empresas } from '../pages/Empresas';
import { Caminhoes } from '../pages/Caminhoes';
import { Motoristas } from '../pages/Motoristas';
import { Rotas } from '../pages/Rotas';
import { Viagens } from '../pages/Viagens';
import { Emissoes } from '../pages/Emissoes';
import { Alertas } from '../pages/Alertas';
import { Relatorios } from '../pages/Relatorios';
import { Sobre } from '../pages/Sobre';
import { Integrantes } from '../pages/Integrantes';
import { FAQ } from '../pages/FAQ';
import { Contato } from '../pages/Contato';

const router = createBrowserRouter([{
  path: '/',
  element: <AppLayout />,
  children: [
    { index: true, element: <Home /> },
    { path: 'dashboard', element: <Dashboard /> },
    { path: 'empresas', element: <Empresas /> },
    { path: 'empresas/:id', element: <Empresas /> },
    { path: 'caminhoes', element: <Caminhoes /> },
    { path: 'motoristas', element: <Motoristas /> },
    { path: 'rotas', element: <Rotas /> },
    { path: 'viagens', element: <Viagens /> },
    { path: 'emissoes', element: <Emissoes /> },
    { path: 'alertas', element: <Alertas /> },
    { path: 'relatorios', element: <Relatorios /> },
    { path: 'sobre', element: <Sobre /> },
    { path: 'integrantes', element: <Integrantes /> },
    { path: 'faq', element: <FAQ /> },
    { path: 'contato', element: <Contato /> },
  ],
}]);

export function AppRoutes() { return <RouterProvider router={router} />; }