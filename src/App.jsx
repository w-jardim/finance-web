import { useEffect, useState } from "react";

function App() {
  const [status, setStatus] = useState("Carregando...");

  useEffect(() => {
    const API_URL = import.meta.env.VITE_API_URL;

    fetch(`${API_URL}/health`)
      .then((res) => res.json())
      .then((data) => {
        setStatus(`API OK - env: ${data.env}`);
      })
      .catch((err) => {
        console.error(err);
        setStatus("Erro ao conectar com API");
      });
  }, []);

  return (
    <div style={{ padding: 40 }}>
      <h1>Virazul Web (DEV LOCAL)</h1>
      <p>Status da API:</p>
      <strong>{status}</strong>
    </div>
  );
}

export default App;