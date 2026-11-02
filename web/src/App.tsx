import { useEffect, useState } from "react";

export function App() {
  const [apiStatus, setApiStatus] = useState<string>("menghubungi API...");

  useEffect(() => {
    fetch("/api/health")
      .then((res) => res.json())
      .then((data) => setApiStatus(`API Status: ${data.status}`))
      .catch(() => setApiStatus("API belum terhubung"));
  }, []);

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>Website Jual Mobil Bekas</h1>
      <p>{apiStatus}</p>
    </div>
  );
}
