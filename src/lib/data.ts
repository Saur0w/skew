export interface GalleryItem {
  id: number;
  imageIndex: number;
  title: string;
  subtitle: string;
  category: string;
  year: string;
  location: string;
  src: string;
}

export const BASE_ITEMS: Omit<GalleryItem, "id">[] = [
  {
    imageIndex: 1,
    title: "Alpine Pinnacle",
    subtitle: "High Altitude Solitude",
    category: "Mountains",
    year: "2024",
    location: "Swiss Alps",
    src: "/images/1.jpg",
  },
  {
    imageIndex: 2,
    title: "Monochrome Villa",
    subtitle: "Modernist Minimal Architecture",
    category: "Architecture",
    year: "2023",
    location: "Valencia, Spain",
    src: "/images/2.jpg",
  },
  {
    imageIndex: 3,
    title: "Golden Chiaroscuro",
    subtitle: "Gaze Through Shadow",
    category: "Portraiture",
    year: "2024",
    location: "Florence, Italy",
    src: "/images/3.jpg",
  },
  {
    imageIndex: 4,
    title: "Bioluminescent Spore",
    subtitle: "Deep Forest Nocturne",
    category: "Botanica",
    year: "2024",
    location: "Hoh Rainforest",
    src: "/images/4.jpg",
  },
  {
    imageIndex: 5,
    title: "Emerald Tree Boa",
    subtitle: "Arboreal Camouflage",
    category: "Fauna",
    year: "2023",
    location: "Amazon Basin",
    src: "/images/5.jpg",
  },
  {
    imageIndex: 6,
    title: "Meadow Solace",
    subtitle: "Wild Cosmos in Golden Hour",
    category: "Botanica",
    year: "2024",
    location: "Provence, France",
    src: "/images/6.jpg",
  },
  {
    imageIndex: 7,
    title: "Chromatic Ascent",
    subtitle: "Helium Spheres in Drift",
    category: "Atmosphere",
    year: "2024",
    location: "Cappadocia, Turkey",
    src: "/images/7.jpg",
  },
  {
    imageIndex: 8,
    title: "Storm Sentinel",
    subtitle: "Atlantic Coastal Waves",
    category: "Seascape",
    year: "2023",
    location: "Faroe Islands",
    src: "/images/8.jpg",
  },
  {
    imageIndex: 9,
    title: "Verdant Canopy",
    subtitle: "Ancient Woodland Shadows",
    category: "Landscape",
    year: "2024",
    location: "Black Forest, Germany",
    src: "/images/9.jpg",
  },
];

// Repeat items to create a smooth, dense infinite loop (18 total items)
export const TOTAL_ITEMS_COUNT = 18;

export const GALLERY_ITEMS: GalleryItem[] = Array.from(
  { length: TOTAL_ITEMS_COUNT },
  (_, i) => {
    const base = BASE_ITEMS[i % BASE_ITEMS.length];
    return {
      ...base,
      id: i,
    };
  }
);
