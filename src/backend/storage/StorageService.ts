import { Validator } from "../validation/validator";
import { Logger } from "../utils/logger";

export class StorageService {
  /**
   * Validates and parses base64 uploaded image data
   */
  static processBase64Upload(imageBase64: string, mimeType: string): { mimeType: string; data: string } | null {
    const validationError = Validator.validateBase64Image(imageBase64, mimeType);
    if (validationError && imageBase64 !== "MOCK_DATA") {
      Logger.error(`Storage Upload Error: ${validationError}`);
      throw new Error(validationError);
    }

    const match = imageBase64.match(/^data:(image\/[a-zA-Z0-9.-]+);base64,(.+)$/);
    if (match) {
      Logger.info(`Storage Upload: Successfully parsed Base64 image. MIME: ${match[1]}`);
      return {
        mimeType: match[1],
        data: match[2]
      };
    }
    
    if (imageBase64 === "MOCK_DATA") {
      return { mimeType, data: "MOCK" };
    }

    return null;
  }

  /**
   * Safely returns fallback content details when live processing fails
   */
  static getFallbackPreset(presetId: string): any {
    Logger.warn(`Storage Service: Fetching fallback preset for ID: ${presetId}`);
    switch (presetId) {
      case "sim_pothole":
        return {
          title: "Deep Pothole causing traffic disruption",
          description: "A wide, deep pothole has formed in the middle of Valencia Street. Multiple vehicles have suffered popped tires. Drivers are swerving dangerously to avoid it.",
          category: "Roads",
          severity: "High",
          communityImpact: "This issue poses a severe safety threat to motorcyclists and cyclists, and causes minor traffic delays. Immediate swerving increases collision risks at this high-density intersection.",
          recommendedActions: [
            "Deploy orange safety cones and warning signs immediately around the pothole.",
            "Dispatch cold-patch asphalt repair crew to apply temporary filler within 12 hours.",
            "Schedule full structural street repaving for this block in the Q3 public works cycle."
          ]
        };
      case "sim_garbage":
        return {
          title: "Illegal Toxic Waste & Garbage Pile",
          description: "Massive pile of commercial waste, broken plastic bins, electronics, and old mattresses dumped behind the community park. Chemical fluids seem to be leaking from a container.",
          category: "Sanitation",
          severity: "Critical",
          communityImpact: "Toxic runoff poses immediate ecological damage to Dolores Park vegetation and risks water table contamination. Piles encourage rodent infestation directly adjacent to children's playground.",
          recommendedActions: [
            "Cordon off the area with biohazard advisory tape to protect park visitors.",
            "Coordinate with Department of Public Health and specialized waste disposal crews.",
            "Review local surveillance footage to identify illegal commercial dumping perpetrators."
          ]
        };
      case "sim_water":
        return {
          title: "Major Main Line Water Pipe Rupture",
          description: "High pressure water main leak on Market Street. Clean drinking water flooding the pedestrian sidewalk and entering the basement of nearby local businesses.",
          category: "Utilities",
          severity: "Critical",
          communityImpact: "Clean water wastage in large volumes. Sidewalk erosion and potential structural basement damage to historical commercial buildings. Minor disruption to streetcar lines.",
          recommendedActions: [
            "Shutdown the localized block shut-off valve immediately to stop pressure.",
            "Sump pump flooded business basements to prevent structural decay.",
            "Excavate and replace the fractured ductile iron pipe segment."
          ]
        };
      case "sim_light":
        return {
          title: "Broken Streetlight exposing electrical wiring",
          description: "The metal streetlamp cover was smashed during a windstorm. Live wiring is hanging down and exposed to rain, reachable by pedestrians on the sidewalk.",
          category: "Safety",
          severity: "High",
          communityImpact: "Direct electrocution risk to pedestrians and domestic animals. Block is completely dark at night, facilitating opportunistic property crime.",
          recommendedActions: [
            "Send emergency electrical crew to isolate the live exposed circuit.",
            "Install a high-visibility hazard warning around the streetlamp post.",
            "Replace the broken luminaire casing with standard weather-proof LED assembly."
          ]
        };
      case "sim_tree":
        return {
          title: "Fallen Tree Branch blocking bike lane",
          description: "A huge oak branch cracked and fell during strong gusty winds. It is entirely blocking the southbound bike lane and partial sidewalk on Harrison St.",
          category: "Environment",
          severity: "Medium",
          communityImpact: "Cyclists are forced to merge into the main high-speed traffic lane, causing immediate bicycle safety hazards. Pedestrians with strollers cannot pass on the sidewalk.",
          recommendedActions: [
            "Dispatch urban forestry chainsaw crew to chop the branch into removable logs.",
            "Clear the bike path of twigs and debris to prevent bicycle tire punctures.",
            "Inspect the parent tree trunk for any further cracks or disease that might prompt structural failure."
          ]
        };
      default:
        return {
          title: "Unidentified Urban Anomaly & Safety Hazard",
          description: "An urban hazard has been logged by a citizen with base64 telemetry attached. Live photos indicate immediate inspection is warranted.",
          category: "Safety",
          severity: "Medium",
          communityImpact: "Potential traffic flow degradation and pedestrian detours inside the immediate sector block.",
          recommendedActions: [
            "Establish standard safety blockades around the coordinates.",
            "Dispatch secondary municipal inspection unit.",
            "Update public database with repair timeline estimates."
          ]
        };
    }
  }
}
