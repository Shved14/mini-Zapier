import { useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";

const REALTIME_URL = "http://localhost:3010";

type StepUpdate = {
  runId: string;
  stepId: string;
  status: "waiting" | "running" | "success" | "failed";
};

type RunUpdate = {
  runId: string;
  status: "waiting" | "running" | "success" | "failed";
};

type SocketCallbacks = {
  onStepUpdate?: (event: StepUpdate) => void;
  onRunUpdate?: (event: RunUpdate) => void;
};

export function useSocket(callbacks?: SocketCallbacks) {
  const socketRef = useRef<Socket | null>(null);
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;

  useEffect(() => {
    const socket = io(REALTIME_URL, {
      transports: ["websocket", "polling"],
      autoConnect: true,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("[ws] connected", socket.id);
    });

    socket.on("step:update", (event: StepUpdate) => {
      callbacksRef.current?.onStepUpdate?.(event);
    });

    socket.on("run:update", (event: RunUpdate) => {
      callbacksRef.current?.onRunUpdate?.(event);
    });

    socket.on("disconnect", (reason: string) => {
      console.log("[ws] disconnected", reason);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  const subscribe = useCallback((runId: string) => {
    socketRef.current?.emit("subscribe", runId);
  }, []);

  const unsubscribe = useCallback((runId: string) => {
    socketRef.current?.emit("unsubscribe", runId);
  }, []);

  return { subscribe, unsubscribe, socket: socketRef };
}
