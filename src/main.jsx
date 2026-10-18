import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { Provider } from 'react-redux'
import './index.css'
import App from './App.jsx'
import { store } from './store'
import { aiRequestHandler } from './services/aiRequestHandler'

// Default fallback client ID for Google OAuth provider
const GOOGLE_CLIENT_ID = "109283749281-exampleclientid.apps.googleusercontent.com";
aiRequestHandler.initialize(store);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <App />
      </GoogleOAuthProvider>
    </Provider>
  </StrictMode>,
)
