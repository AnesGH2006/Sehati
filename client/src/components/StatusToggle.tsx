
import { useState } from "react";

interface StatusToggleProps {
  initialStatus: boolean;
  onStatusChange?: (isOnline: boolean) => void;
}

export default function StatusToggle({ initialStatus, onStatusChange }: StatusToggleProps) {
  const [isOnline, setIsOnline] = useState(initialStatus);
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    const newStatus = !isOnline;
    setLoading(true);

    try {
      const res = await fetch("/api/artisan/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isOnline: newStatus }),
      });

      if (res.ok) {
        setIsOnline(newStatus);
        onStatusChange?.(newStatus);
      }
    } catch (err) {
      console.error("فشل تحديث الحالة:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="status-toggle-wrapper">
      <span className={`status-dot ${isOnline ? "online" : "offline"}`} />
      <span className="status-label">
        {isOnline ? "متاح للعمل" : "غير متاح"}
      </span>
      <button
        onClick={handleToggle}
        disabled={loading}
        className={`toggle-btn ${isOnline ? "btn-go-offline" : "btn-go-online"}`}
      >
        {loading ? "..." : isOnline ? "إيقاف" : "تفعيل"}
      </button>

      <style>{`
        .status-toggle-wrapper {
          display: flex;
          align-items: center;
          gap: 10px;
          direction: rtl;
          background: #f8f9fa;
          border-radius: 12px;
          padding: 10px 16px;
          width: fit-content;
        }
        .status-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .status-dot.online {
          background: #22c55e;
          box-shadow: 0 0 0 3px rgba(34,197,94,0.25);
          animation: pulse-green 2s infinite;
        }
        .status-dot.offline {
          background: #94a3b8;
        }
        @keyframes pulse-green {
          0%, 100% { box-shadow: 0 0 0 3px rgba(34,197,94,0.25); }
          50%       { box-shadow: 0 0 0 6px rgba(34,197,94,0.1); }
        }
        .status-label {
          font-size: 14px;
          font-weight: 600;
          color: #374151;
        }
        .toggle-btn {
          border: none;
          border-radius: 8px;
          padding: 6px 14px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-go-offline {
          background: #fee2e2;
          color: #dc2626;
        }
        .btn-go-offline:hover { background: #fecaca; }
        .btn-go-online {
          background: #dcfce7;
          color: #16a34a;
        }
        .btn-go-online:hover { background: #bbf7d0; }
        .toggle-btn:disabled { opacity: 0.6; cursor: not-allowed; }
      `}</style>
    </div>
  );
}