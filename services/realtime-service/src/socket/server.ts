import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import { EVENTS, StepEvent, RunEvent } from "../events/types";
import { logger } from "../utils/logger";

let io: Server;

export function createSocketServer(httpServer: HttpServer): Server {
  const corsOrigin = process.env.CORS_ORIGIN || "http://localhost:3007";

  io = new Server(httpServer, {
    cors: {
      origin: corsOrigin,
      methods: ["GET", "POST"],
    },
    pingInterval: 25000,
    pingTimeout: 20000,
  });

  io.on("connection", (socket: Socket) => {
    logger.info("Client connected", { socketId: socket.id });

    socket.on(EVENTS.SUBSCRIBE, (runId: string) => {
      if (!runId || typeof runId !== "string") {
        socket.emit("error", { message: "runId must be a non-empty string" });
        return;
      }

      const room = `run:${runId}`;
      socket.join(room);
      logger.info("Client subscribed to run", { socketId: socket.id, runId });
      socket.emit("subscribed", { runId });
    });

    socket.on(EVENTS.UNSUBSCRIBE, (runId: string) => {
      if (!runId || typeof runId !== "string") return;

      const room = `run:${runId}`;
      socket.leave(room);
      logger.info("Client unsubscribed from run", { socketId: socket.id, runId });
      socket.emit("unsubscribed", { runId });
    });

    socket.on("disconnect", (reason: string) => {
      logger.info("Client disconnected", { socketId: socket.id, reason });
    });
  });

  logger.info("Socket.IO server initialized", { corsOrigin });

  return io;
}

export function getIO(): Server {
  if (!io) {
    throw new Error("Socket.IO server not initialized");
  }
  return io;
}

export function emitStepUpdate(event: StepEvent): void {
  const room = `run:${event.runId}`;
  getIO().to(room).emit(EVENTS.STEP_UPDATE, event);
  logger.debug("Emitted step update", event);
}

export function emitRunUpdate(event: RunEvent): void {
  const room = `run:${event.runId}`;
  getIO().to(room).emit(EVENTS.RUN_UPDATE, event);
  logger.debug("Emitted run update", event);
}

export function getConnectedClientsCount(): number {
  return getIO().engine.clientsCount;
}

export function getRoomSize(runId: string): number {
  const room = getIO().sockets.adapter.rooms.get(`run:${runId}`);
  return room ? room.size : 0;
}
