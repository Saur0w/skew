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
    title: "Celestial Drift",
    subtitle: "Helium spheres in morning haze",
    category: "Atmosphere",
    year: "2024",
    location: "Cappadocia, Turkey",
    src: "/images/1.jpg",
  },
  {
    imageIndex: 2,
    title: "Mount Fuji",
    subtitle: "Dusk horizon across Lake Kawaguchi",
    category: "Landscape",
    year: "2024",
    location: "Honshu, Japan",
    src: "/images/2.jpg",
  },
  {
    imageIndex: 3,
    title: "Namib Crest",
    subtitle: "Wind-carved desert geometry",
    category: "Nature",
    year: "2023",
    location: "Sossusvlei, Namibia",
    src: "/images/3.jpg",
  },
  {
    imageIndex: 4,
    title: "Autumn Solitude",
    subtitle: "Winding path through golden woods",
    category: "Landscape",
    year: "2024",
    location: "Kyoto Highlands, Japan",
    src: "/images/4.jpg",
  },
  {
    imageIndex: 5,
    title: "Cumulus Glow",
    subtitle: "Golden hour atmospheric formation",
    category: "Atmosphere",
    year: "2024",
    location: "Swiss Alps",
    src: "/images/5.jpg",
  },
  {
    imageIndex: 6,
    title: "Ocean Sentinel",
    subtitle: "Granite beacon in Atlantic spray",
    category: "Seascape",
    year: "2023",
    location: "Brittany, France",
    src: "/images/6.jpg",
  },
  {
    imageIndex: 7,
    title: "Golden Meridian",
    subtitle: "Sunset over harvest grasslands",
    category: "Nature",
    year: "2024",
    location: "Tuscany, Italy",
    src: "/images/7.jpg",
  },
  {
    imageIndex: 8,
    title: "Glacial Ridge",
    subtitle: "Snow-dusted granite spires",
    category: "Mountains",
    year: "2024",
    location: "Patagonia, Chile",
    src: "/images/8.jpg",
  },
  {
    imageIndex: 9,
    title: "Nordic Pavilion",
    subtitle: "Minimalist shelter in the wilderness",
    category: "Architecture",
    year: "2023",
    location: "Faroe Islands",
    src: "/images/9.jpg",
  },
];

// Repeat items to create a smooth, dense infinite loop (36 total items = 4 cycles)
export const TOTAL_ITEMS_COUNT = 36;

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
