
import { useEffect, useState } from "react";
import { checkBackendHealth } from "../services/healthService";

function BackendStatus() {
  const [status, setStatus] = useState("checking");

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const data = await checkBackendHealth();

        if (data.status === "healthy") {
          setStatus("connected");
        } else {
          setStatus("disconnected");
        }
      } catch (error) {
        setStatus("disconnected");
      }
    };

    checkConnection();

    // Check the backend again every 30 seconds.
    const interval = setInterval(checkConnection, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-2 text-sm">
      <span
        className={`h-2.5 w-2.5 rounded-full ${
          status === "connected"
            ? "bg-green-500"
            : status === "disconnected"
            ? "bg-red-500"
            : "bg-yellow-500"
        }`}
      />

      <span className="text-gray-600">
        {status === "connected"
          ? "Backend Connected"
          : status === "disconnected"
          ? "Backend Disconnected"
          : "Checking Backend..."}
      </span>
    </div>
  );
}

export default BackendStatus;
