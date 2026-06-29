import { Request, Response } from "express";
import { Logger } from "../utils/logger";

interface MeshNode {
  id: string;
  callsign: string;
  distance: number;
  signalStrength: number;
  battery: number;
  deviceType: "Phone" | "Tablet" | "Relay Node" | "Base Beacon";
  status: "Direct" | "Relayed" | "Syncing";
  hops: number;
  lastActive: number; // timestamp
}

interface OfflineMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: string;
  channel: string;
  status: "Delivered" | "Relaying" | "Mesh-Broadcast";
  hopsCount: number;
  isSOS?: boolean;
}

// Simple in-memory storage for Local Network Offline Mesh
const meshMessages: OfflineMessage[] = [
  {
    id: "m_srv_1",
    sender: "Rescue_HQ_Beacon",
    text: "BLE Mesh network initialized over local router. Direct local network sync is active.",
    timestamp: new Date().toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit" }),
    channel: "Local Broadcast",
    status: "Mesh-Broadcast",
    hopsCount: 1
  }
];

const activeNodes = new Map<string, MeshNode>();

export class MeshController {
  /**
   * Retrieves all live local network mesh messages.
   */
  static getMessages(req: Request, res: Response): Response {
    try {
      return res.status(200).json(meshMessages);
    } catch (error: any) {
      Logger.error("MeshController.getMessages failed", error);
      return res.status(500).json({ error: "Failed to load local mesh messages" });
    }
  }

  /**
   * Post a new message to the local network mesh memory pool.
   */
  static postMessage(req: Request, res: Response): Response {
    try {
      const { sender, text, channel, isSOS } = req.body;

      if (!sender || !text || !channel) {
        return res.status(400).json({ error: "Missing required packet payload elements (sender, text, channel)" });
      }

      const dateNow = new Date();
      const timeStr = `${String(dateNow.getHours()).padStart(2, "0")}:${String(dateNow.getMinutes()).padStart(2, "0")}`;

      const newMessage: OfflineMessage = {
        id: `m_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        sender: String(sender).trim().slice(0, 30),
        text: String(text).trim().slice(0, 1000),
        timestamp: timeStr,
        channel: String(channel),
        status: "Mesh-Broadcast",
        hopsCount: 1,
        isSOS: !!isSOS
      };

      meshMessages.push(newMessage);

      // Keep only latest 100 messages in local server memory
      if (meshMessages.length > 100) {
        meshMessages.shift();
      }

      Logger.info(`MeshController: Local network packet broadcasted by [${sender}] on channel [${channel}]`);
      return res.status(201).json(newMessage);
    } catch (error: any) {
      Logger.error("MeshController.postMessage failed", error);
      return res.status(500).json({ error: "Failed to broadcast local mesh packet" });
    }
  }

  /**
   * Retrieves all active peer nodes currently connected to the local network mesh.
   */
  static getNodes(req: Request, res: Response): Response {
    try {
      const now = Date.now();
      // Remove stale nodes (inactive for more than 20 seconds)
      for (const [id, node] of activeNodes.entries()) {
        if (now - node.lastActive > 20000) {
          activeNodes.delete(id);
        }
      }

      return res.status(200).json(Array.from(activeNodes.values()));
    } catch (error: any) {
      Logger.error("MeshController.getNodes failed", error);
      return res.status(500).json({ error: "Failed to query local network mesh nodes" });
    }
  }

  /**
   * Registers or updates a peer node's local network presence.
   */
  static registerNode(req: Request, res: Response): Response {
    try {
      const { id, callsign, battery, deviceType, distance, signalStrength } = req.body;

      if (!id || !callsign) {
        return res.status(400).json({ error: "Node registration requires active ID and Callsign" });
      }

      const updatedNode: MeshNode = {
        id,
        callsign: String(callsign).trim().slice(0, 30),
        battery: typeof battery === "number" ? battery : 85,
        deviceType: deviceType || "Phone",
        distance: typeof distance === "number" ? distance : 50,
        signalStrength: typeof signalStrength === "number" ? signalStrength : -70,
        status: "Direct",
        hops: 1,
        lastActive: Date.now()
      };

      activeNodes.set(id, updatedNode);
      return res.status(200).json(updatedNode);
    } catch (error: any) {
      Logger.error("MeshController.registerNode failed", error);
      return res.status(500).json({ error: "Failed to update local network mesh node registry" });
    }
  }
}
