// src/components/PageLoader.jsx
// شاشة التحميل الكاملة — تظهر أثناء fetch أو isLoading

export default function PageLoader({ text = "حرفتي" }) {
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{ background: "#12172a" }}
    >
      {/* توهج خلفي */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 300, height: 300,
          background: "radial-gradient(circle, rgba(45,212,191,0.10) 0%, transparent 70%)",
          animation: "glowPulse 2.5s ease-in-out infinite",
        }}
      />

      <div className="relative flex items-center justify-center" style={{ width: 220, height: 220 }}>
        {/* حلقة خارجية */}
        <div className="absolute rounded-full" style={{ width: 216, height: 216, border: "1.5px solid transparent", borderTopColor: "rgba(45,212,191,0.22)", animation: "spin 7s linear infinite reverse" }} />
        {/* حلقة متقطعة */}
        <div className="absolute rounded-full" style={{ width: 200, height: 200, border: "1.5px dashed rgba(45,212,191,0.18)", animation: "spin 9s linear infinite" }} />
        {/* الحلقة الرئيسية */}
        <div className="absolute rounded-full" style={{ width: 184, height: 184, border: "2.5px solid transparent", borderTopColor: "#2dd4bf", borderRightColor: "#2dd4bf", animation: "spin 2.2s linear infinite", boxShadow: "0 0 20px rgba(45,212,191,0.4)" }} />
        {/* حلقة داخلية معاكسة */}
        <div className="absolute rounded-full" style={{ width: 158, height: 158, border: "2px solid transparent", borderBottomColor: "#00c4a0", borderLeftColor: "#00c4a0", animation: "spin 1.7s linear infinite reverse", opacity: 0.65 }} />

        {/* الدائرة المركزية */}
        <div
          className="relative z-10 flex items-center justify-center rounded-full"
          style={{
            width: 108, height: 108,
            background: "radial-gradient(circle at 38% 38%, #1e2d4a, #0e1628)",
            border: "1.5px solid rgba(45,212,191,0.2)",
            boxShadow: "inset 0 0 24px rgba(45,212,191,0.08), 0 0 20px rgba(45,212,191,0.12)",
            animation: "innerPulse 3s ease-in-out infinite",
          }}
        >
          <div
            className="flex items-center justify-center rounded-full font-bold text-2xl"
            style={{
              width: 60, height: 60,
              background: "linear-gradient(135deg, #2dd4bf, #00a896)",
              color: "#0e1628",
              animation: "bob 3s ease-in-out infinite",
              userSelect: "none",
            }}
          >
            ح
          </div>
        </div>
      </div>

      {text && (
        <p className="mt-5 text-xl font-bold" style={{ color: "#2dd4bf", direction: "rtl", letterSpacing: "0.05em", animation: "fadePulse 2.5s ease-in-out infinite" }}>
          {text}
        </p>
      )}

      <div className="flex gap-1.5 mt-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-full" style={{ width: 6, height: 6, background: "#2dd4bf", opacity: 0.7, animation: `dotBounce 1.2s ease-in-out ${i * 0.2}s infinite` }} />
        ))}
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes bob { 0%,100% { transform: scale(1) rotate(-3deg); } 50% { transform: scale(0.92) rotate(3deg); } }
        @keyframes innerPulse { 0%,100% { box-shadow: inset 0 0 24px rgba(45,212,191,0.08), 0 0 20px rgba(45,212,191,0.12); } 50% { box-shadow: inset 0 0 32px rgba(45,212,191,0.15), 0 0 32px rgba(45,212,191,0.22); } }
        @keyframes glowPulse { 0%,100% { opacity: 0.6; transform: scale(1); } 50% { opacity: 1; transform: scale(1.15); } }
        @keyframes fadePulse { 0%,100% { opacity: 0.6; } 50% { opacity: 1; } }
        @keyframes dotBounce { 0%,80%,100% { transform: translateY(0); opacity: 0.4; } 40% { transform: translateY(-6px); opacity: 1; } }
      `}</style>
    </div>
  );
}