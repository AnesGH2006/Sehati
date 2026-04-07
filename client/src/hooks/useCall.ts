import { useEffect, useRef, useState, useCallback } from "react";

export type CallState = "idle" | "calling" | "incoming" | "active" | "ended";
export type CallType = "audio" | "video";

interface UseCallProps {
  myId: string;
  myName: string;
}

export function useCall({ myId, myName }: UseCallProps) {
  const [callState, setCallState] = useState<CallState>("idle");
  const [callType, setCallType] = useState<CallType>("audio");
  const [remoteId, setRemoteId] = useState<string | null>(null);
  const [remoteName, setRemoteName] = useState<string>("");
  const [isMuted, setIsMuted] = useState(false);
  const [isCamOff, setIsCamOff] = useState(false);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const socketRef = useRef<any>(null);
  const remoteIdRef = useRef<string | null>(null);
  const callTypeRef = useRef<CallType>("audio");
  const pendingCandidates = useRef<RTCIceCandidateInit[]>([]);

  useEffect(() => { remoteIdRef.current = remoteId; }, [remoteId]);
  useEffect(() => { callTypeRef.current = callType; }, [callType]);

  const ICE_SERVERS = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
      {
        urls: "turn:openrelay.metered.ca:80",
        username: "openrelayproject",
        credential: "openrelayproject",
      },
      {
        urls: "turn:openrelay.metered.ca:443",
        username: "openrelayproject",
        credential: "openrelayproject",
      },
      {
        urls: "turn:openrelay.metered.ca:443?transport=tcp",
        username: "openrelayproject",
        credential: "openrelayproject",
      },
    ],
  };

  const getMedia = async (type: CallType) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
        video: type === "video" ? { width: 1280, height: 720 } : false,
      });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.play().catch(() => {});
      }
      return stream;
    } catch (err: any) {
      if (err.name === "NotAllowedError") {
        throw new Error("يرجى السماح بالوصول للميكروفون والكاميرا");
      } else if (err.name === "NotFoundError") {
        throw new Error("لم يتم العثور على ميكروفون أو كاميرا");
      }
      throw err;
    }
  };

  const setupPeerConnection = useCallback((targetId: string) => {
    // Close existing connection if any
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);
    pcRef.current = pc;

    // Add local tracks
    localStreamRef.current?.getTracks().forEach(track => {
      pc.addTrack(track, localStreamRef.current!);
    });

    // Send ICE candidates
    pc.onicecandidate = (e) => {
      if (e.candidate) {
        socketRef.current?.emit("rtc:ice", {
          to: targetId,
          candidate: e.candidate,
        });
      }
    };

    // Receive remote stream
    pc.ontrack = (e) => {
      console.log("📡 Remote track received:", e.track.kind);
      if (remoteVideoRef.current && e.streams[0]) {
        remoteVideoRef.current.srcObject = e.streams[0];
        remoteVideoRef.current.play().catch(() => {});
      }
    };

    pc.onconnectionstatechange = () => {
      console.log("🔗 Connection state:", pc.connectionState);
      if (pc.connectionState === "failed") {
        pc.restartIce();
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log("🧊 ICE state:", pc.iceConnectionState);
    };

    return pc;
  }, []);

  const flushPendingCandidates = async () => {
    if (!pcRef.current) return;
    for (const candidate of pendingCandidates.current) {
      try {
        await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      } catch {}
    }
    pendingCandidates.current = [];
  };

  const cleanup = useCallback(() => {
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    localStreamRef.current = null;
    pcRef.current?.close();
    pcRef.current = null;
    pendingCandidates.current = [];
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    setIsMuted(false);
    setIsCamOff(false);
  }, []);

  useEffect(() => {
    if (!myId) return;

    import("socket.io-client").then(({ io }) => {
      const socket = io(window.location.origin, {
        query: { userId: myId },
        path: "/socket.io",
        transports: ["websocket", "polling"],
      });
      socketRef.current = socket;

      socket.on("connect", () => {
        console.log("✅ Socket connected:", socket.id);
      });

      socket.on("disconnect", () => {
        console.log("❌ Socket disconnected");
      });

      // ── Incoming call ────────────────────────────────────────────────────
      socket.on("call:incoming", ({ from, fromName, callType: ct }: any) => {
        console.log("📞 Incoming call from:", fromName);
        setRemoteId(from);
        remoteIdRef.current = from;
        setRemoteName(fromName);
        setCallType(ct);
        callTypeRef.current = ct;
        setCallState("incoming");
      });

      // ── Caller: callee accepted → send offer ─────────────────────────────
      socket.on("call:accepted", async ({ from }: any) => {
        console.log("✅ Call accepted, sending offer to:", remoteIdRef.current);
        setCallState("active");
        try {
          const targetId = remoteIdRef.current!;
          const pc = setupPeerConnection(targetId);
          const offer = await pc.createOffer({
            offerToReceiveAudio: true,
            offerToReceiveVideo: callTypeRef.current === "video",
          });
          await pc.setLocalDescription(offer);
          socket.emit("rtc:offer", { to: targetId, offer });
        } catch (err) {
          console.error("Offer error:", err);
        }
      });

      socket.on("call:rejected", () => {
        console.log("❌ Call rejected");
        cleanup();
        setCallState("ended");
        setTimeout(() => setCallState("idle"), 2000);
      });

      socket.on("call:ended", () => {
        console.log("📴 Call ended by remote");
        cleanup();
        setCallState("ended");
        setTimeout(() => setCallState("idle"), 2000);
      });

      // ── Callee: receives offer → send answer ─────────────────────────────
      socket.on("rtc:offer", async ({ from, offer }: any) => {
        console.log("📨 Received offer from:", from);
        try {
          const pc = setupPeerConnection(from);
          await pc.setRemoteDescription(new RTCSessionDescription(offer));
          await flushPendingCandidates();
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit("rtc:answer", { to: from, answer });
        } catch (err) {
          console.error("Answer error:", err);
        }
      });

      // ── Caller: receives answer ──────────────────────────────────────────
      socket.on("rtc:answer", async ({ answer }: any) => {
        console.log("📨 Received answer");
        try {
          await pcRef.current?.setRemoteDescription(new RTCSessionDescription(answer));
          await flushPendingCandidates();
        } catch (err) {
          console.error("Set answer error:", err);
        }
      });

      // ── ICE candidates ───────────────────────────────────────────────────
      socket.on("rtc:ice", async ({ candidate }: any) => {
        if (!candidate) return;
        const pc = pcRef.current;
        if (pc && pc.remoteDescription) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          } catch {}
        } else {
          // Queue candidates until remote description is set
          pendingCandidates.current.push(candidate);
        }
      });

    }).catch(() => {
      console.warn("socket.io-client not available");
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [myId]);

  // ── Start call (caller side) ─────────────────────────────────────────────
  const startCall = useCallback(async (targetId: string, targetName: string, type: CallType) => {
    if (!socketRef.current?.connected) {
      alert("الاتصال بالسيرفر غير متاح، حاول مجدداً");
      return;
    }
    setRemoteId(targetId);
    remoteIdRef.current = targetId;
    setRemoteName(targetName);
    setCallType(type);
    callTypeRef.current = type;
    setCallState("calling");

    try {
      await getMedia(type);
      socketRef.current.emit("call:start", {
        to: targetId,
        from: myId,
        fromName: myName,
        callType: type,
      });
    } catch (err: any) {
      alert(err.message || "لا يمكن الوصول للميكروفون أو الكاميرا");
      setCallState("idle");
    }
  }, [myId, myName]);

  // ── Accept call (callee side) ────────────────────────────────────────────
  const acceptCall = useCallback(async () => {
    try {
      await getMedia(callTypeRef.current);
      socketRef.current?.emit("call:accept", { to: remoteIdRef.current });
      setCallState("active");
      // PeerConnection will be built when rtc:offer arrives
    } catch (err: any) {
      alert(err.message || "لا يمكن الوصول للميكروفون أو الكاميرا");
    }
  }, []);

  const rejectCall = useCallback(() => {
    socketRef.current?.emit("call:reject", { to: remoteIdRef.current });
    cleanup();
    setCallState("idle");
  }, [cleanup]);

  const endCall = useCallback(() => {
    socketRef.current?.emit("call:end", { to: remoteIdRef.current });
    cleanup();
    setCallState("ended");
    setTimeout(() => setCallState("idle"), 2000);
  }, [cleanup]);

  const toggleMute = useCallback(() => {
    localStreamRef.current?.getAudioTracks().forEach(t => {
      t.enabled = !t.enabled;
    });
    setIsMuted(p => !p);
  }, []);

  const toggleCamera = useCallback(() => {
    localStreamRef.current?.getVideoTracks().forEach(t => {
      t.enabled = !t.enabled;
    });
    setIsCamOff(p => !p);
  }, []);

  return {
    callState, callType, remoteId, remoteName,
    isMuted, isCamOff,
    localVideoRef, remoteVideoRef,
    startCall, acceptCall, rejectCall, endCall,
    toggleMute, toggleCamera,
  };
}