import React from "react"
import ReactDOM from "react-dom/client"
import App from "./App.jsx"
import "./index.css"

console.log("Looking for root element...")
const rootElement = document.getElementById("root")
console.log("Root element found:", rootElement)

if (!rootElement) {
  console.error("Root element not found!")
  console.log("Available elements:", document.body.innerHTML)
  throw new Error("Root element not found. Make sure there's a div with id='root' in your HTML.")
}

console.log("Creating React root...")
ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
