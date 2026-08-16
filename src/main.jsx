import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import {Provider} from "react-redux";
import {store} from "./app/store.js"
import {GoogleOAuthProvider} from "@react-oauth/google";
createRoot(document.getElementById('root')).render(
  //wrapping store to all components using provider 
  <Provider store={store}>
    
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <StrictMode >
        <App />
      </StrictMode>
  </GoogleOAuthProvider>
  </Provider>
)
