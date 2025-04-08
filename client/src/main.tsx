import { createRoot } from "react-dom/client";
import "./index.css";

// Create a very simple app to test rendering
function SimpleApp() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      fontFamily: 'Arial, sans-serif',
      backgroundColor: 'white'
    }}>
      <h1 style={{ color: '#2563eb' }}>Rich Habits Dashboard</h1>
      <p>Test page for connectivity issues</p>
      <div style={{ 
        margin: '20px 0',
        padding: '10px 20px',
        backgroundColor: '#2563eb',
        color: 'white',
        borderRadius: '4px',
        cursor: 'pointer'
      }}>
        Login Button
      </div>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<SimpleApp />);
