import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff, PhoneIncoming } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { CallState, CallType } from "@/hooks/useCall";

interface CallUIProps {
  callState: CallState;
  callType: CallType;
  remoteName: string;
  remoteImage?: string;
  isMuted: boolean;
  isCamOff: boolean;
  localVideoRef: React.RefObject<HTMLVideoElement>;
  remoteVideoRef: React.RefObject<HTMLVideoElement>;
  onAccept: () => void;
  onReject: () => void;
  onEnd: () => void;
  onToggleMute: () => void;
  onToggleCamera: () => void;
}

export function CallUI({
  callState, callType, remoteName, remoteImage,
  isMuted, isCamOff,
  localVideoRef, remoteVideoRef,
  onAccept, onReject, onEnd, onToggleMute, onToggleCamera,
}: CallUIProps) {

  // Ringtone using Web Audio API
  useEffect(() => {
    if (callState !== "incoming" && callState !== "calling") return;
    const ctx = new AudioContext();
    let stopped = false;

    const ring = () => {
      if (stopped) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = callState === "incoming" ? 440 : 520;
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
      setTimeout(ring, 1200);
    };
    ring();
    return () => { stopped = true; ctx.close(); };
  }, [callState]);

  if (callState === "idle") return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center"
        dir="rtl"
      >
        {/* Background */}
        <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" />

        {/* Video streams (video calls only) */}
        {callType === "video" && callState === "active" && (
          <>
            {/* Remote video - full screen */}
            <video
              ref={remoteVideoRef}
              autoPlay playsInline
              className="absolute inset-0 w-full h-full object-cover"
            />
            {/* Local video - picture in picture */}
            <video
              ref={localVideoRef}
              autoPlay playsInline muted
              className="absolute bottom-24 left-4 w-32 h-44 object-cover rounded-2xl border-2 border-white/20 shadow-xl z-10"
            />
          </>
        )}

        {/* UI Overlay */}
        <div className="relative z-20 flex flex-col items-center gap-6 p-8 w-full max-w-sm">

          {/* Caller info */}
          {(callState === "calling" || callState === "incoming" || callState === "active" && callType === "audio") && (
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <Avatar className="h-28 w-28 border-4 border-white/20">
                  <AvatarFallback className="bg-primary/30 text-white text-4xl font-bold">
                    {remoteName?.[0] || "؟"}
                  </AvatarFallback>
                </Avatar>
                {/* Pulse animation */}
                {(callState === "calling" || callState === "incoming") && (
                  <>
                    <span className="absolute inset-0 rounded-full border-2 border-primary/40 animate-ping" />
                    <span className="absolute -inset-3 rounded-full border border-primary/20 animate-ping" style={{ animationDelay: "0.3s" }} />
                  </>
                )}
              </div>
              <div className="text-center">
                <p className="text-white text-2xl font-bold">{remoteName}</p>
                <p className="text-white/60 text-sm mt-1">
                  {callState === "calling" && "جاري الاتصال..."}
                  {callState === "incoming" && `مكالمة ${callType === "video" ? "بالكاميرا" : "صوتية"} واردة`}
                  {callState === "active" && "متصل الآن"}
                  {callState === "ended" && "انتهت المكالمة"}
                </p>
              </div>
            </div>
          )}

          {/* Active audio call - show name at top */}
          {callState === "active" && callType === "video" && (
            <div className="absolute top-6 right-6 text-white font-bold text-sm bg-black/40 px-3 py-1.5 rounded-full backdrop-blur">
              {remoteName}
            </div>
          )}

          {/* Ended state */}
          {callState === "ended" && (
            <div className="flex flex-col items-center gap-3">
              <div className="h-20 w-20 rounded-full bg-red-500/20 flex items-center justify-center">
                <PhoneOff className="h-10 w-10 text-red-400" />
              </div>
              <p className="text-white text-xl font-bold">انتهت المكالمة</p>
            </div>
          )}

          {/* Controls */}
          <div className="flex items-center gap-6 mt-4">

            {/* Incoming call */}
            {callState === "incoming" && (
              <>
                <button onClick={onReject}
                  className="h-16 w-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center shadow-lg shadow-red-500/30 transition-all active:scale-95">
                  <PhoneOff className="h-7 w-7 text-white" />
                </button>
                <button onClick={onAccept}
                  className="h-16 w-16 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center shadow-lg shadow-green-500/30 transition-all active:scale-95 animate-bounce">
                  <Phone className="h-7 w-7 text-white" />
                </button>
              </>
            )}

            {/* Calling / Active */}
            {(callState === "calling" || callState === "active") && (
              <>
                {/* Mute */}
                <button onClick={onToggleMute}
                  className={`h-14 w-14 rounded-full flex items-center justify-center transition-all active:scale-95 ${isMuted ? 'bg-red-500/80 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}>
                  {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
                </button>

                {/* End call */}
                <button onClick={onEnd}
                  className="h-16 w-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center shadow-lg shadow-red-500/30 transition-all active:scale-95">
                  <PhoneOff className="h-7 w-7 text-white" />
                </button>

                {/* Camera toggle (video only) */}
                {callType === "video" && (
                  <button onClick={onToggleCamera}
                    className={`h-14 w-14 rounded-full flex items-center justify-center transition-all active:scale-95 ${isCamOff ? 'bg-red-500/80 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}>
                    {isCamOff ? <VideoOff className="h-6 w-6" /> : <Video className="h-6 w-6" />}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}