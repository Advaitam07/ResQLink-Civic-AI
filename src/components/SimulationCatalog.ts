export interface PresetIssue {
  id: string;
  name: string;
  thumbnailUrl: string;
  category: string;
  description: string;
  // base64 mock or direct unsplash URL for visual render
  imageUrl: string;
}

export const SIMULATION_ISSUES: PresetIssue[] = [
  {
    id: "sim_pothole",
    name: "Craters & Deep Road Rupture",
    thumbnailUrl: "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&w=120&h=120&q=80",
    imageUrl: "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&w=800&q=80",
    category: "Roads",
    description: "Deep pothole asphalt crater exposing subbase gravel on public roadway, posing structural damage risk."
  },
  {
    id: "sim_garbage",
    name: "Illegal Waste Dump & Mattresses",
    thumbnailUrl: "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&w=120&h=120&q=80",
    imageUrl: "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&w=800&q=80",
    category: "Sanitation",
    description: "Illegal commercial garbage pile including discarded tires, mattresses, plastic trash bags blocking park rear paths."
  },
  {
    id: "sim_water",
    name: "Ruptured Water Utility Main",
    thumbnailUrl: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=120&h=120&q=80",
    imageUrl: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80",
    category: "Utilities",
    description: "High pressure water pipe leaking underground, flooding street sidewalk and nearby business steps."
  },
  {
    id: "sim_light",
    name: "Damaged Streetlight Wiring",
    thumbnailUrl: "https://images.unsplash.com/photo-1542397284385-601017642477?auto=format&fit=crop&w=120&h=120&q=80",
    imageUrl: "https://images.unsplash.com/photo-1542397284385-601017642477?auto=format&fit=crop&w=800&q=80",
    category: "Safety",
    description: "Smashed public streetlight lens, leaving internal light components and live copper wire exposed to rainfall."
  },
  {
    id: "sim_tree",
    name: "Fallen Tree Branch in Lane",
    thumbnailUrl: "https://images.unsplash.com/photo-1488330890490-c291ecf62711?auto=format&fit=crop&w=120&h=120&q=80",
    imageUrl: "https://images.unsplash.com/photo-1488330890490-c291ecf62711?auto=format&fit=crop&w=800&q=80",
    category: "Environment",
    description: "Heavy oak tree branch snapped blocking commuter bicycle path and obstructing visual lines for crosswalk."
  }
];

// Base64 helper for preset image loading (using a small grey square or fetching standard base64 if needed)
// To feed unsplash photos into Gemini, we will download them in the client using canvas to base64, 
// which is a highly robust solution to convert any web URL to base64 for Gemini!
export async function convertUrlToBase64(url: string): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error("Canvas context failed"));
        return;
      }
      ctx.drawImage(img, 0, 0);
      try {
        const dataURL = canvas.toDataURL('image/jpeg', 0.85);
        const base64 = dataURL.split(',')[1];
        resolve({ base64, mimeType: 'image/jpeg' });
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = (e) => reject(new Error("Failed to load image url: " + url));
    img.src = url;
  });
}
