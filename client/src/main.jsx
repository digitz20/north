import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { SnackbarProvider } from 'notistack';
import App from './App';
import store from './store/store';
import './styles/global.css';
import { DynamicThemeProvider } from './hooks/useDarkMode';
import { SocketProvider } from './contexts/SocketContext';

ReactDOM.createRoot(document.getElementById('root')).render(
  <Provider store={store}>
    <BrowserRouter>
      <DynamicThemeProvider>
        <SnackbarProvider maxSnack={3} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
          <SocketProvider>
            <App />
          </SocketProvider>
        </SnackbarProvider>
      </DynamicThemeProvider>
    </BrowserRouter>
  </Provider>
);