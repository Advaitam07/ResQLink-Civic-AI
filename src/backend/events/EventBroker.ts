import { EventEmitter } from "events";
import { Logger } from "../utils/logger";

export type CivicBackendEvent = 
  | "MissionCreated" 
  | "ImageUploaded" 
  | "ImageAnalyzed" 
  | "LocationVerified" 
  | "DuplicateDetected" 
  | "RiskCalculated" 
  | "ActionPlanGenerated" 
  | "MissionCompleted";

class EventBroker extends EventEmitter {
  private static instance: EventBroker;

  private constructor() {
    super();
    this.registerDefaultHandlers();
  }

  static getInstance(): EventBroker {
    if (!EventBroker.instance) {
      EventBroker.instance = new EventBroker();
    }
    return EventBroker.instance;
  }

  /**
   * Safe typed emit helper
   */
  publish(event: CivicBackendEvent, payload: any): void {
    Logger.event(event, `Publishing event to dispatchers. Payload ID: ${payload?.id || "N/A"}`);
    this.emit(event, payload);
  }

  /**
   * Safe typed subscribe helper
   */
  subscribe(event: CivicBackendEvent, handler: (payload: any) => void): void {
    this.on(event, handler);
  }

  /**
   * Initialize standard enterprise handlers for the event stream
   */
  private registerDefaultHandlers(): void {
    // 1. MissionCreated
    this.subscribe("MissionCreated", (payload) => {
      Logger.event("MissionCreated", `NEW CIVIC TICKET DISPATCHED: "${payload.title}" (ID: ${payload.id})`);
      // Simulating enterprise audit trigger
      Logger.info(`[Audit-Engine] Enqueueing geospatial validation pipeline for: ${payload.id}`);
    });

    // 2. ImageUploaded
    this.subscribe("ImageUploaded", (payload) => {
      Logger.event("ImageUploaded", `Evidence photo attached. Size: ${payload.sizeBytes} bytes. MIME: ${payload.mimeType}`);
    });

    // 3. ImageAnalyzed
    this.subscribe("ImageAnalyzed", (payload) => {
      Logger.event("ImageAnalyzed", `Gemini Multi-Modal analysis processed. Diagnostic: "${payload.title}" | Category: ${payload.category}`);
    });

    // 4. LocationVerified
    this.subscribe("LocationVerified", (payload) => {
      Logger.event("LocationVerified", `Geospatial coordinates verified at [Lat: ${payload.lat}, Lng: ${payload.lng}]. Address Resolved: "${payload.address}"`);
    });

    // 5. DuplicateDetected
    this.subscribe("DuplicateDetected", (payload) => {
      Logger.event("DuplicateDetected", `Duplicate threshold alert! Base Ticket: ${payload.baseId} matched Cluster: ${payload.clusterId} at ${payload.confidence}% confidence`);
    });

    // 6. RiskCalculated
    this.subscribe("RiskCalculated", (payload) => {
      Logger.event("RiskCalculated", `Impact metrics updated. Severity Score: ${payload.score}/10. Priority level: ${payload.severity}.`);
    });

    // 7. ActionPlanGenerated
    this.subscribe("ActionPlanGenerated", (payload) => {
      Logger.event("ActionPlanGenerated", `Tactical repair plan formulated for Division: "${payload.department}". ${payload.stepsCount} dispatch items.`);
    });

    // 8. MissionCompleted
    this.subscribe("MissionCompleted", (payload) => {
      Logger.event("MissionCompleted", `MISSION RESOLVED: "${payload.title}" has been successfully completed. Citizen reward points allocated.`);
    });
  }
}

export const eventBroker = EventBroker.getInstance();
export default eventBroker;
