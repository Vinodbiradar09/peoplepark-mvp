import WebSocket, { WebSocketServer } from "ws";
import { IncomingMessage } from "http";
import http from "http";
import { auth, User } from "@repo/auth";
import { fromNodeHeaders } from "better-auth/node";

interface AuthenticatedWebSocket extends WebSocket {
  user: User;
}

export class RoomConnectioManager {
  private wss: WebSocketServer;

  constructor(private readonly server: http.Server) {
    this.wss = new WebSocketServer({ noServer: true });
    this.setupUpgradeHandler();
    this.connectionInitialize();
  }

  private setupUpgradeHandler() {
    this.server.on("upgrade", async (req: IncomingMessage, socket, head) => {
      const { pathname } = new URL(req.url || "", `http://${req.headers.host}`);
      if (pathname === "/room") {
        try {
          const session = await auth.api.getSession({
            headers: fromNodeHeaders(req.headers),
          });
          if (!session || !session.user) {
            socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
            socket.destroy();
            return;
          }
          this.wss.handleUpgrade(req, socket, head, (ws) => {
            const authenticatedWs = ws as AuthenticatedWebSocket;
            authenticatedWs.user = session.user;
            this.wss.emit("connection", authenticatedWs, req);
          });
        } catch (error) {
          console.error("WS Auth Error:", error);
          socket.write("HTTP/1.1 500 Internal Server Error\r\n\r\n");
          socket.destroy();
        }
      }
    });
  }

  private connectionInitialize() {
    this.wss.on("connection", (ws: AuthenticatedWebSocket, req: IncomingMessage) =>{
        this.Connection(ws , req);
    });
  }

  private Connection(ws: AuthenticatedWebSocket, req: IncomingMessage) {
    const user = ws.user;
    console.log("User " , user.email , "connected");
    ws.on("message" , ( data )=>{
        console.log("received" , user.id , data);
    })

    ws.on("close" , ()=>{
        console.log("User" , user.id) , "disconnected";
    })
  }
}
