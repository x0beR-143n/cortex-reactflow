import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@xyflow/react/dist/style.css';
import '@mantine/core/styles.css';        // v8: styles mới
import './styles/index.css'
import { MantineProvider } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// routes
import FlowEdit from './pages/FlowEdit.tsx'
import HomePage from './pages/HomePage.tsx';
import App from './pages/App.tsx';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Toaster } from 'react-hot-toast'

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {path: "flow/:id", element: <FlowEdit />},
      {path: "", element: <HomePage />},
    ]
  }
])

const queryClient = new QueryClient();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
      <MantineProvider>
        <QueryClientProvider client={queryClient}>
          <Toaster
            toastOptions={{
              duration: 2500,
              style: {
                background: '#1e293b',
                color: '#fff',
                border: '1px solid #334155',
              },
              success: {
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#1e293b',
                },
              },
            }}
          />
          <RouterProvider router={router}></RouterProvider>
        </QueryClientProvider>
      </MantineProvider>
  </StrictMode>,
)
