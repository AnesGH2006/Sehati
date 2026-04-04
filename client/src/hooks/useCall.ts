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

  useEffect(() => {
    if (!myId) return;

    // Lazy load socket.io-client to avoid crash if not installed
    import("socket.io-client").then(({ io }) => {
      const socket = io(window.location.origin, {
        query: { userId: myId },
        path: "/socket.io",
      });
      socketRef.current = socket;

      socket.on("call:incoming", ({ from, fromName, callType: ct }: any) => {
        setRemoteId(from);
        setRemoteName(fromName);
        setCallType(ct);
        setCallState("incoming");
      });

      socket.on("call:accepted", async () => {
        setCallState("active");
        await createAndSendOffer(from => socket.emit("rtc:offer", { to: from, offer: {} }));
      });

      socket.on("call:rejected", () => { cleanup(); setCallState("ended"); setTimeout(() => setCallState("idle"), 2000); });
      socket.on("call:ended", () => { cleanup(); setCallState("ended"); setTimeout(() => setCallState("idle"), 2000); });

      socket.on("rtc:offer", async ({ from, offer }: any) => {
        await setupPeerConnection(from);
        await pcRef.current!.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pcRef.current!.createAnswer();
        await pcRef.current!.setLocalDescription(answer);
        socket.emit("rtc:answer", { to: from, answer });
      });

      socket.on("rtc:answer", async ({ answer }: any) => {
        await pcRef.current?.setRemoteDescription(new RTCSessionDescription(answer));
      });

      socket.on("rtc:ice", async ({ candidate }: any) => {
        try { await pcRef.current?.addIceCandidate(new RTCIceCandidate(candidate)); } catch {}
      });
    }).catch(() => {
      console.warn("socket.io-client not available — calls disabled");
    });

    return () => { socketRef.current?.disconnect(); };
  }, [myId]);

  const getMedia = async (type: CallType) => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: type === "video" });
    localStreamRef.current = stream;
    if (localVideoRef.current) localVideoRef.current.srcObject = stream;
    return stream;
  };

  const setupPeerConnection = async (targetId?: string) => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }, { urls: "stun:stun1.l.google.com:19302" }],
    });
    pcRef.current = pc;
    localStreamRef.current?.getTracks().forEach(track => pc.addTrack(track, localStreamRef.current!));
    pc.onicecandidate = (e) => {
      if (e.candidate && (targetId || remoteId)) {
        socketRef.current?.emit("rtc:ice", { to: targetId || remoteId, candidate: e.candidate });
      }
    };
    pc.ontrack = (e) => {
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = e.streams[0];
    };
    return pc;
  };

  const createAndSendOffer = async (onOffer?: (to: string) => void) => {
    await setupPeerConnection();
    const offer = await pcRef.current!.createOffer();
    await pcRef.current!.setLocalDescription(offer);
    socketRef.current?.emit("rtc:offer", { to: remoteId, offer });
  };

  const startCall = useCallback(async (targetId: string, targetName: string, type: CallType) => {
    if (!socketRef.current) {
      alert("خدمة المكالمات غير متاحة حالياً. تأكد من تثبيت socket.io-client");
      return;
    }
    setRemoteId(targetId);
    setRemoteName(targetName);
    setCallType(type);
    setCallState("calling");
    try {
      await getMedia(type);
      socketRef.current.emit("call:start", { to: targetId, from: myId, fromName: myName, callType: type });
    } catch (err) {
      alert("لا يمكن الوصول للميكروفون أو الكاميرا");
      setCallState("idle");
    }
  }, [myId, myName]);

  const acceptCall = useCallback(async () => {
    try {
      await getMedia(callType);
      socketRef.current?.emit("call:accept", { to: remoteId });
      setCallState("active");
    } catch {
      alert("لا يمكن الوصول للميكروفون أو الكاميرا");
    }
  }, [callType, remoteId]);

  const rejectCall = useCallback(() => {
    socketRef.current?.emit("call:reject", { to: remoteId });
    cleanup();
    setCallState("idle");
  }, [remoteId]);

  const endCall = useCallback(() => {
    socketRef.current?.emit("call:end", { to: remoteId });
    cleanup();
    setCallState("ended");
    setTimeout(() => setCallState("idle"), 2000);
  }, [remoteId]);

  const toggleMute = useCallback(() => {
    localStreamRef.current?.getAudioTracks().forEach(t => { t.enabled = !t.enabled; });
    setIsMuted(p => !p);
  }, []);

  const toggleCamera = useCallback(() => {
    localStreamRef.current?.getVideoTracks().forEach(t => { t.enabled = !t.enabled; });
    setIsCamOff(p => !p);
  }, []);

  const cleanup = () => {
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    localStreamRef.current = null;
    pcRef.current?.close();
    pcRef.current = null;
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    setIsMuted(false);
    setIsCamOff(false);
  };

  return {
    callState, callType, remoteId, remoteName,
    isMuted, isCamOff,
    localVideoRef, remoteVideoRef,
    startCall, acceptCall, rejectCall, endCall,
    toggleMute, toggleCamera,
  };
}

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

  const socketRef = useRef<Socket | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

  // Connect socket
  useEffect(() => {
    if (!myId) return;
    const socket = io(window.location.origin, {
      query: { userId: myId },
      path: "/socket.io",
    });
    socketRef.current = socket;

    socket.on("call:incoming", ({ from, fromName, callType: ct }: any) => {
      setRemoteId(from);
      setRemoteName(fromName);
      setCallType(ct);
      setCallState("incoming");
    });

    socket.on("call:accepted", async () => {
      setCallState("active");
      await createAndSendOffer();
    });

    socket.on("call:rejected", () => {
      cleanup();
      setCallState("ended");
      setTimeout(() => setCallState("idle"), 2000);
    });

    socket.on("call:ended", () => {
      cleanup();
      setCallState("ended");
      setTimeout(() => setCallState("idle"), 2000);
    });

    socket.on("rtc:offer", async ({ from, offer }: any) => {
      if (!pcRef.current) await setupPeerConnection();
      await pcRef.current!.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pcRef.current!.createAnswer();
      await pcRef.current!.setLocalDescription(answer);
      socket.emit("rtc:answer", { to: from, answer });
    });

    socket.on("rtc:answer", async ({ answer }: any) => {
      await pcRef.current?.setRemoteDescription(new RTCSessionDescription(answer));
    });

    socket.on("rtc:ice", async ({ candidate }: any) => {
      try {
        await pcRef.current?.addIceCandidate(new RTCIceCandidate(candidate));
      } catch {}
    });

    return () => { socket.disconnect(); };
  }, [myId]);

  const getMedia = async (type: CallType) => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: type === "video",
    });
    localStreamRef.current = stream;
    if (localVideoRef.current) localVideoRef.current.srcObject = stream;
    return stream;
  };

  const setupPeerConnection = async () => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
      ],
    });
    pcRef.current = pc;

    // Add local tracks
    localStreamRef.current?.getTracks().forEach(track => {
      pc.addTrack(track, localStreamRef.current!);
    });

    // ICE candidates
    pc.onicecandidate = (e) => {
      if (e.candidate && remoteId) {
        socketRef.current?.emit("rtc:ice", { to: remoteId, candidate: e.candidate });
      }
    };

    // Remote stream
    pc.ontrack = (e) => {
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = e.streams[0];
    };

    return pc;
  };

  const createAndSendOffer = async () => {
    await setupPeerConnection();
    const offer = await pcRef.current!.createOffer();
    await pcRef.current!.setLocalDescription(offer);
    socketRef.current?.emit("rtc:offer", { to: remoteId, offer });
  };

  const startCall = useCallback(async (targetId: string, targetName: string, type: CallType) => {
    setRemoteId(targetId);
    setRemoteName(targetName);
    setCallType(type);
    setCallState("calling");
    await getMedia(type);
    socketRef.current?.emit("call:start", {
      to: targetId, from: myId, fromName: myName, callType: type,
    });
  }, [myId, myName]);

  const acceptCall = useCallback(async () => {
    await getMedia(callType);
    socketRef.current?.emit("call:accept", { to: remoteId });
    setCallState("active");
  }, [callType, remoteId]);

  const rejectCall = useCallback(() => {
    socketRef.current?.emit("call:reject", { to: remoteId });
    cleanup();
    setCallState("idle");
  }, [remoteId]);

  const endCall = useCallback(() => {
    socketRef.current?.emit("call:end", { to: remoteId });
    cleanup();
    setCallState("ended");
    setTimeout(() => setCallState("idle"), 2000);
  }, [remoteId]);

  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(t => { t.enabled = !t.enabled; });
      setIsMuted(p => !p);
    }
  }, []);

  const toggleCamera = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach(t => { t.enabled = !t.enabled; });
      setIsCamOff(p => !p);
    }
  }, []);

  const cleanup = () => {
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    localStreamRef.current = null;
    pcRef.current?.close();
    pcRef.current = null;
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    setIsMuted(false);
    setIsCamOff(false);
  };

  return {
    callState, callType, remoteId, remoteName,
    isMuted, isCamOff,
    localVideoRef, remoteVideoRef,
    startCall, acceptCall, rejectCall, endCall,
    toggleMute, toggleCamera,
  };
}