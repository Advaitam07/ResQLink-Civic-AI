import { CivicIssue, CivicUser } from "../../types";
import { getFirestoreDb } from "./firebaseConn";
import { 
  collection, 
  getDocs, 
  doc, 
  getDoc, 
  setDoc, 
  writeBatch,
  query,
  limit
} from "firebase/firestore";
import { Logger } from "../utils/logger";

// Seed Issues
const SEED_ISSUES: CivicIssue[] = [
  {
    id: "iss_001",
    title: "Deep Pothole causing traffic disruption",
    description: "A wide, deep pothole has formed in the middle of Valencia Street. Multiple vehicles have suffered popped tires. Drivers are swerving dangerously to avoid it.",
    category: "Roads",
    status: "Reported",
    severity: "High",
    communityImpact: "This issue poses a severe safety threat to motorcyclists and cyclists, and causes minor traffic delays. Immediate swerving increases collision risks at this high-density intersection.",
    location: {
      lat: 37.7610,
      lng: -122.4218,
      address: "100 Valencia St, San Francisco, CA 94103",
    },
    reporter: {
      name: "Marcus Vance",
      email: "marcus.vance@gmail.com",
    },
    createdAt: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
    imageUrl: "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&w=800&q=80",
    recommendedActions: [
      "Deploy orange safety cones and warning signs immediately around the pothole.",
      "Dispatch cold-patch asphalt repair crew to apply temporary filler within 12 hours.",
      "Schedule full structural street repaving for this block in the Q3 public works cycle."
    ],
    upvotes: 42,
    upvotedBy: ["test@example.com"],
    comments: [
      {
        id: "cmt_1",
        user: "Sarah Jenkins",
        userEmail: "sarah.j@gmail.com",
        text: "Almost hit this on my scooter today, please fix this ASAP!",
        createdAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
      },
      {
        id: "cmt_2",
        user: "Alex Chen",
        userEmail: "alex.chen@yahoo.com",
        text: "I reported this to 311 yesterday too. Glad it's here with AI priority.",
        createdAt: new Date(Date.now() - 3600000 * 24 * 1.5).toISOString(),
      }
    ],
    timeline: [
      {
        status: "Reported",
        description: "Civic issue logged via ResQLink Portal. AI diagnosed as high severity.",
        timestamp: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
        actor: "Civic AI"
      }
    ]
  },
  {
    id: "iss_002",
    title: "Illegal Toxic Waste & Garbage Pile",
    description: "Massive pile of commercial waste, broken plastic bins, electronics, and old mattresses dumped behind the community park. Chemical fluids seem to be leaking from a container.",
    category: "Sanitation",
    status: "In Progress",
    severity: "Critical",
    communityImpact: "Toxic runoff poses immediate ecological damage to Dolores Park vegetation and risks water table contamination. Piles encourage rodent infestation directly adjacent to children's playground.",
    location: {
      lat: 37.7595,
      lng: -122.4270,
      address: "19th St & Dolores St, San Francisco, CA 94114",
    },
    reporter: {
      name: "Clara Oswald",
      email: "clara.osw@outlook.com",
    },
    createdAt: new Date(Date.now() - 3600000 * 24 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 24 * 1).toISOString(),
    imageUrl: "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&w=800&q=80",
    recommendedActions: [
      "Cordon off the area with biohazard advisory tape to protect park visitors.",
      "Coordinate with Department of Public Health and specialized waste disposal crews.",
      "Review local surveillance footage to identify illegal commercial dumping perpetrators."
    ],
    upvotes: 89,
    upvotedBy: ["admin@civic.com"],
    comments: [
      {
        id: "cmt_3",
        user: "Park Ranger Dave",
        userEmail: "dave.parks@sfgov.org",
        text: "Sanitation department has been notified. Specialized containment crew is on route today.",
        createdAt: new Date(Date.now() - 3600000 * 24 * 1).toISOString(),
      }
    ],
    timeline: [
      {
        status: "Reported",
        description: "AI designated as Critical Priority due to potential biochemical leakage.",
        timestamp: new Date(Date.now() - 3600000 * 24 * 5).toISOString(),
        actor: "Civic AI"
      },
      {
        status: "Assigned",
        description: "Ticket automatically dispatched to SF Public Works Sanitation Division.",
        timestamp: new Date(Date.now() - 3600000 * 24 * 4).toISOString(),
        actor: "System"
      },
      {
        status: "In Progress",
        description: "Containment units deployed. Cleanup operation initiated.",
        timestamp: new Date(Date.now() - 3600000 * 24 * 1).toISOString(),
        actor: "Municipal Worker"
      }
    ]
  },
  {
    id: "iss_003",
    title: "Major Main Line Water Pipe Rupture",
    description: "High pressure water main leak on Market Street. Clean drinking water flooding the pedestrian sidewalk and entering the basement of nearby local businesses.",
    category: "Utilities",
    status: "Resolved",
    severity: "Critical",
    communityImpact: "Clean water wastage in large volumes. Sidewalk erosion and potential structural basement damage to historical commercial buildings. Minor disruption to streetcar lines.",
    location: {
      lat: 37.7749,
      lng: -122.4194,
      address: "1155 Market St, San Francisco, CA 94103",
    },
    reporter: {
      name: "Jordan Belfort",
      email: "jordan@stratton.com",
    },
    createdAt: new Date(Date.now() - 3600000 * 24 * 10).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 24 * 8).toISOString(),
    imageUrl: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80",
    recommendedActions: [
      "Shutdown the localized block shut-off valve immediately to stop pressure.",
      "Sump pump flooded business basements to prevent structural decay.",
      "Excavate and replace the fractured ductile iron pipe segment."
    ],
    upvotes: 110,
    upvotedBy: [],
    comments: [
      {
        id: "cmt_4",
        user: "Business Owner Greg",
        userEmail: "greg@gregscafe.com",
        text: "Public Works team did a great job responding so quickly. Thank you!",
        createdAt: new Date(Date.now() - 3600000 * 24 * 8).toISOString(),
      }
    ],
    timeline: [
      {
        status: "Reported",
        description: "Water pipe failure detected. AI dispatched utility priority alerts.",
        timestamp: new Date(Date.now() - 3600000 * 24 * 10).toISOString(),
        actor: "Civic AI"
      },
      {
        status: "In Progress",
        description: "Water shutoff completed. Repair crews on site welding replacement pipe.",
        timestamp: new Date(Date.now() - 3600000 * 24 * 9.5).toISOString(),
        actor: "Municipal Worker"
      },
      {
        status: "Resolved",
        description: "Repair finished. Sidewalk repaved and business owners cleared. Water service restored.",
        timestamp: new Date(Date.now() - 3600000 * 24 * 8).toISOString(),
        actor: "Municipal Worker"
      }
    ]
  },
  {
    id: "iss_004",
    title: "Broken Streetlight exposing electrical wiring",
    description: "The metal streetlamp cover was smashed during a windstorm. Live wiring is hanging down and exposed to rain, reachable by pedestrians on the sidewalk.",
    category: "Safety",
    status: "Assigned",
    severity: "High",
    communityImpact: "Direct electrocution risk to pedestrians and domestic animals. Block is completely dark at night, facilitating opportunistic property crime.",
    location: {
      lat: 37.7648,
      lng: -122.4330,
      address: "245 Church St, San Francisco, CA 94114",
    },
    reporter: {
      name: "Liam Neeson",
      email: "liam@taken.com",
    },
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    imageUrl: "https://images.unsplash.com/photo-1542397284385-601017642477?auto=format&fit=crop&w=800&q=80",
    recommendedActions: [
      "Send emergency electrical crew to isolate the live exposed circuit.",
      "Install a high-visibility hazard warning around the streetlamp post.",
      "Replace the broken luminaire casing with standard weather-proof LED assembly."
    ],
    upvotes: 18,
    upvotedBy: [],
    comments: [],
    timeline: [
      {
        status: "Reported",
        description: "AI isolated high risk elements due to rainwater and electrical exposure combination.",
        timestamp: new Date(Date.now() - 3600000 * 12).toISOString(),
        actor: "Civic AI"
      },
      {
        status: "Assigned",
        description: "Dispatched with Priority 1 status to Electrical Maintenance Division.",
        timestamp: new Date(Date.now() - 3600000 * 10).toISOString(),
        actor: "System"
      }
    ]
  },
  {
    id: "iss_005",
    title: "Fallen Tree Branch blocking bike lane",
    description: "A huge oak branch cracked and fell during strong gusty winds. It is entirely blocking the southbound bike lane and partial sidewalk on Harrison St.",
    category: "Environment",
    status: "Reported",
    severity: "Medium",
    communityImpact: "Cyclists are forced to merge into the main high-speed traffic lane, causing immediate bicycle safety hazards. Pedestrians with strollers cannot pass on the sidewalk.",
    location: {
      lat: 37.7701,
      lng: -122.4115,
      address: "1000 Harrison St, San Francisco, CA 94103",
    },
    reporter: {
      name: "Emma Watson",
      email: "emma@hogwarts.edu",
    },
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    imageUrl: "https://images.unsplash.com/photo-1488330890490-c291ecf62711?auto=format&fit=crop&w=800&q=80",
    recommendedActions: [
      "Dispatch urban forestry chainsaw crew to chop the branch into removable logs.",
      "Clear the bike path of twigs and debris to prevent bicycle tire punctures.",
      "Inspect the parent tree trunk for any further cracks or disease that might prompt structural failure."
    ],
    upvotes: 9,
    upvotedBy: [],
    comments: [],
    timeline: [
      {
        status: "Reported",
        description: "Civic report received. Category allocated to Environment.",
        timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
        actor: "Civic AI"
      }
    ]
  }
];

const SEED_USERS: CivicUser[] = [
  { name: "Marcus Vance", email: "marcus.vance@gmail.com", points: 240, reportsCount: 4, resolvedCount: 2 },
  { name: "Clara Oswald", email: "clara.osw@outlook.com", points: 195, reportsCount: 3, resolvedCount: 1 },
  { name: "Jordan Belfort", email: "jordan@stratton.com", points: 150, reportsCount: 2, resolvedCount: 2 },
  { name: "Sarah Jenkins", email: "sarah.j@gmail.com", points: 80, reportsCount: 0, resolvedCount: 0 },
  { name: "Alex Chen", email: "alex.chen@yahoo.com", points: 65, reportsCount: 0, resolvedCount: 0 }
];

export class DatabaseService {
  
  static async fetchAllIssues(): Promise<CivicIssue[]> {
    Logger.info("Database Query: fetchAllIssues initiated via Firestore");
    try {
      const db = getFirestoreDb();
      const issuesCol = collection(db, "issues");
      const snapshot = await getDocs(issuesCol);
      
      if (snapshot.empty) {
        Logger.info("Firestore issues collection is empty, seeding database...");
        await this.seedIssues();
        return SEED_ISSUES;
      }

      const issues: CivicIssue[] = [];
      snapshot.forEach((docSnap) => {
        issues.push(docSnap.data() as CivicIssue);
      });

      // Sort by createdAt descending (newest first)
      issues.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return issues;
    } catch (error) {
      Logger.error("Failed to fetch issues from Firestore, returning local seed fallback", error);
      return SEED_ISSUES;
    }
  }

  static async persistIssues(issues: CivicIssue[]): Promise<void> {
    Logger.info(`Database Mutate: persistIssues running for ${issues.length} records in Firestore`);
    try {
      const db = getFirestoreDb();
      // Write each issue individually or via batch. If issues.length is small, we can write in batch
      const batch = writeBatch(db);
      issues.forEach((issue) => {
        const issueRef = doc(db, "issues", issue.id);
        batch.set(issueRef, issue);
      });
      await batch.commit();
      Logger.info("Database Mutate: persistIssues batch commit succeeded");
    } catch (error) {
      Logger.error("Failed to persist issues to Firestore", error);
    }
  }

  static async findIssueById(id: string): Promise<CivicIssue | null> {
    Logger.info(`Database Query: findIssueById initiated for ID: ${id} via Firestore`);
    try {
      const db = getFirestoreDb();
      const issueRef = doc(db, "issues", id);
      const docSnap = await getDoc(issueRef);
      if (docSnap.exists()) {
        return docSnap.data() as CivicIssue;
      }
      Logger.warn(`Database Query: findIssueById failed for ID: ${id} in Firestore`);
      return null;
    } catch (error) {
      Logger.error(`Failed to find issue by ID: ${id} in Firestore`, error);
      // Fallback to local list in memory
      const allIssues = await this.fetchAllIssues();
      return allIssues.find(issue => issue.id === id) || null;
    }
  }

  static async fetchAllUsers(): Promise<CivicUser[]> {
    Logger.info("Database Query: fetchAllUsers initiated via Firestore");
    try {
      const db = getFirestoreDb();
      const usersCol = collection(db, "users");
      const snapshot = await getDocs(usersCol);

      if (snapshot.empty) {
        Logger.info("Firestore users collection is empty, seeding database...");
        await this.seedUsers();
        return SEED_USERS;
      }

      const users: CivicUser[] = [];
      snapshot.forEach((docSnap) => {
        users.push(docSnap.data() as CivicUser);
      });

      // Sort by points descending
      users.sort((a, b) => b.points - a.points);
      return users;
    } catch (error) {
      Logger.error("Failed to fetch users from Firestore, returning local seed fallback", error);
      return SEED_USERS;
    }
  }

  static async creditUserPoints(email: string, points: number, isNewReport = false, isResolved = false): Promise<CivicUser> {
    Logger.info(`Database Mutate: creditUserPoints for ${email} in Firestore`);
    try {
      const db = getFirestoreDb();
      const userRef = doc(db, "users", email.toLowerCase());
      const docSnap = await getDoc(userRef);

      let user: CivicUser;
      if (docSnap.exists()) {
        const data = docSnap.data() as CivicUser;
        user = {
          ...data,
          points: data.points + points,
          reportsCount: isNewReport ? data.reportsCount + 1 : data.reportsCount,
          resolvedCount: isResolved ? data.resolvedCount + 1 : data.resolvedCount
        };
      } else {
        const defaultName = email.split("@")[0].replace(/[._-]/g, " ");
        const nameFormatted = defaultName.charAt(0).toUpperCase() + defaultName.slice(1);
        user = {
          name: nameFormatted,
          email: email.toLowerCase(),
          points: points,
          reportsCount: isNewReport ? 1 : 0,
          resolvedCount: isResolved ? 1 : 0
        };
      }

      await setDoc(userRef, user);
      Logger.info(`Database Mutate: creditUserPoints update completed for ${email}`);
      return user;
    } catch (error) {
      Logger.error(`Failed to credit user points for ${email} in Firestore`, error);
      // Fallback: create mock profile in memory
      return {
        name: email.split("@")[0],
        email,
        points,
        reportsCount: isNewReport ? 1 : 0,
        resolvedCount: isResolved ? 1 : 0
      };
    }
  }

  static async fetchAllResourceAlerts(): Promise<any[]> {
    Logger.info("Database Query: fetchAllResourceAlerts initiated via Firestore");
    try {
      const db = getFirestoreDb();
      const alertsCol = collection(db, "resource_alerts");
      const snapshot = await getDocs(alertsCol);
      const alerts: any[] = [];
      snapshot.forEach((docSnap) => {
        alerts.push(docSnap.data());
      });
      // Sort by timestamp descending
      alerts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      return alerts;
    } catch (error) {
      Logger.error("Failed to fetch resource alerts from Firestore", error);
      return [];
    }
  }

  static async createResourceAlert(alert: any): Promise<void> {
    Logger.info(`Database Mutate: createResourceAlert running for alert ${alert.id}`);
    try {
      const db = getFirestoreDb();
      const alertRef = doc(db, "resource_alerts", alert.id);
      await setDoc(alertRef, alert);
      Logger.info("Database Mutate: createResourceAlert succeeded");
    } catch (error) {
      Logger.error("Failed to create resource alert in Firestore", error);
    }
  }

  static async fetchAllMutualAidRequests(): Promise<any[]> {
    Logger.info("Database Query: fetchAllMutualAidRequests initiated via Firestore");
    try {
      const db = getFirestoreDb();
      const aidCol = collection(db, "mutual_aid");
      const snapshot = await getDocs(aidCol);
      const requests: any[] = [];
      snapshot.forEach((docSnap) => {
        requests.push(docSnap.data());
      });
      requests.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      return requests;
    } catch (error) {
      Logger.error("Failed to fetch mutual aid requests from Firestore", error);
      return [];
    }
  }

  static async createMutualAidRequest(reqData: any): Promise<void> {
    Logger.info(`Database Mutate: createMutualAidRequest running for ${reqData.id}`);
    try {
      const db = getFirestoreDb();
      const docRef = doc(db, "mutual_aid", reqData.id);
      await setDoc(docRef, reqData);
      Logger.info("Database Mutate: createMutualAidRequest succeeded");
    } catch (error) {
      Logger.error("Failed to create mutual aid request in Firestore", error);
    }
  }

  static async updateMutualAidRequestStatus(id: string, status: string): Promise<void> {
    Logger.info(`Database Mutate: updateMutualAidRequestStatus running for ${id}`);
    try {
      const db = getFirestoreDb();
      const docRef = doc(db, "mutual_aid", id);
      await setDoc(docRef, { status, updatedAt: new Date().toISOString() }, { merge: true });
      Logger.info("Database Mutate: updateMutualAidRequestStatus succeeded");
    } catch (error) {
      Logger.error("Failed to update mutual aid request in Firestore", error);
    }
  }

  static async fetchFinalSafeguard(email: string): Promise<any | null> {
    Logger.info(`Database Query: fetchFinalSafeguard running for ${email}`);
    try {
      const db = getFirestoreDb();
      const docRef = doc(db, "final_safeguards", email.toLowerCase());
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return snap.data();
      }
      return null;
    } catch (error) {
      Logger.error("Failed to fetch final safeguard from Firestore", error);
      return null;
    }
  }

  static async saveFinalSafeguard(safeguard: any): Promise<void> {
    Logger.info(`Database Mutate: saveFinalSafeguard running for ${safeguard.email}`);
    try {
      const db = getFirestoreDb();
      const docRef = doc(db, "final_safeguards", safeguard.email.toLowerCase());
      await setDoc(docRef, safeguard);
      Logger.info("Database Mutate: saveFinalSafeguard succeeded");
    } catch (error) {
      Logger.error("Failed to save final safeguard in Firestore", error);
    }
  }

  // Internal Seeding Helpers
  private static async seedIssues(): Promise<void> {
    try {
      const db = getFirestoreDb();
      const batch = writeBatch(db);
      SEED_ISSUES.forEach((issue) => {
        const issueRef = doc(db, "issues", issue.id);
        batch.set(issueRef, issue);
      });
      await batch.commit();
      Logger.info("Seeded issues in Firestore successfully");
    } catch (err) {
      Logger.error("Error seeding issues to Firestore", err);
    }
  }

  private static async seedUsers(): Promise<void> {
    try {
      const db = getFirestoreDb();
      const batch = writeBatch(db);
      SEED_USERS.forEach((user) => {
        const userRef = doc(db, "users", user.email.toLowerCase());
        batch.set(userRef, user);
      });
      await batch.commit();
      Logger.info("Seeded users in Firestore successfully");
    } catch (err) {
      Logger.error("Error seeding users to Firestore", err);
    }
  }
}
