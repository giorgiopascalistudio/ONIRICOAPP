import { MaterialTemplate, ColorPalette, ScenePreset, BoardElement } from './types';

export const EXQUISITE_MATERIALS: MaterialTemplate[] = [
  // WOODS
  {
    id: 'mat-oak',
    name: 'Rovere Naturale',
    category: 'wood',
    color: '#deb887',
    textureUrl: 'https://images.unsplash.com/photo-1541123437800-1bb1317badc2?auto=format&fit=crop&q=80&w=600',
    roughness: 0.5,
    metalness: 0.05
  },
  {
    id: 'mat-walnut',
    name: 'Noce Canaletto',
    category: 'wood',
    color: '#5c4033',
    textureUrl: 'https://images.unsplash.com/photo-1601056639398-3f139d48fc5b?auto=format&fit=crop&q=80&w=600',
    roughness: 0.45,
    metalness: 0.05
  },
  {
    id: 'mat-slats',
    name: 'Cannettato Acustico',
    category: 'wood',
    color: '#b08d57',
    textureUrl: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&q=80&w=600',
    roughness: 0.6,
    metalness: 0.1
  },

  // STONES
  {
    id: 'mat-carrara',
    name: 'Marmo Statuario',
    category: 'stone',
    color: '#fafafa',
    textureUrl: 'https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&q=80&w=600',
    roughness: 0.12,
    metalness: 0.25
  },
  {
    id: 'mat-travertine',
    name: 'Travertino Navona',
    category: 'stone',
    color: '#eedcb3',
    textureUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=600',
    roughness: 0.75,
    metalness: 0.0
  },
  {
    id: 'mat-granite',
    name: 'Ardesia Scuro',
    category: 'stone',
    color: '#2e2e2e',
    textureUrl: 'https://images.unsplash.com/photo-1517260911058-0fcfd7331021?auto=format&fit=crop&q=80&w=600',
    roughness: 0.8,
    metalness: 0.15
  },

  // FABRICS
  {
    id: 'mat-boucle',
    name: 'Bouclé Panna',
    category: 'fabric',
    color: '#fbf9f4',
    textureUrl: 'https://images.unsplash.com/photo-1571242318041-38fb2a60b947?auto=format&fit=crop&q=80&w=600',
    roughness: 0.95,
    metalness: 0.0
  },
  {
    id: 'mat-velvet',
    name: 'Velluto Salvia',
    category: 'fabric',
    color: '#4f5d50',
    textureUrl: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&q=80&w=600',
    roughness: 0.7,
    metalness: 0.1
  },
  {
    id: 'mat-terracotta-fabric',
    name: 'Lino Terracotta',
    category: 'fabric',
    color: '#c27d38',
    textureUrl: 'https://images.unsplash.com/photo-1505673542670-a5e3ff5b14a3?auto=format&fit=crop&q=80&w=600',
    roughness: 0.9,
    metalness: 0.0
  },

  // METALS
  {
    id: 'mat-brass',
    name: 'Ottone Spazzolato',
    category: 'metal',
    color: '#dfb76c',
    roughness: 0.25,
    metalness: 0.95
  },
  {
    id: 'mat-copper',
    name: 'Rame Grezzo',
    category: 'metal',
    color: '#b87333',
    roughness: 0.35,
    metalness: 0.9
  },
  {
    id: 'mat-steel',
    name: 'Acciaio Brunito',
    category: 'metal',
    color: '#444444',
    roughness: 0.15,
    metalness: 0.98
  },

  // GLASS
  {
    id: 'mat-fluted',
    name: 'Vetro Cannettato',
    category: 'glass',
    color: '#e0f0f0',
    roughness: 0.15,
    metalness: 0.9,
    opacity: 0.65
  },
  {
    id: 'mat-smoked',
    name: 'Vetro Fumè',
    category: 'glass',
    color: '#322d28',
    roughness: 0.1,
    metalness: 0.85,
    opacity: 0.75
  }
];

export const PRESET_PALETTES: ColorPalette[] = [
  {
    id: 'pal-neutral',
    name: 'Symphony Neutra (Bouclé, Rovere, Marmo)',
    colors: ['#F5F5F4', '#E7E5E4', '#D6D3D1', '#A8A29E', '#78716C', '#44403C']
  },
  {
    id: 'pal-earth',
    name: 'Terre Calde di Toscana',
    colors: ['#E6DFD3', '#D3C2AF', '#B29B82', '#A36E51', '#804E35', '#4E3120']
  },
  {
    id: 'pal-forest',
    name: 'Sottobosco e Salvia Marina',
    colors: ['#E2E8F0', '#CBD5E1', '#8FA89B', '#5A7D69', '#3B5245', '#1E2923']
  },
  {
    id: 'pal-minimalist',
    name: 'Contrasti d\'Architettura',
    colors: ['#FFFFFF', '#F1F5F9', '#94A3B8', '#475569', '#1E293B', '#0F172A']
  }
];

export const SCENE_PRESETS: ScenePreset[] = [
  {
    id: 'scene-giorno',
    name: 'Giorno (Luce Naturale)',
    icon: 'Sun',
    ambientColor: '#EAEAE5',
    ambientIntensity: 0.9,
    directColor: '#FFFDF0',
    directIntensity: 1.6,
    bgColor: '#EAEAE5',
    tableColor: '#D1D1C7',
    tableRoughness: 0.8
  },
  {
    id: 'scene-notte',
    name: 'Notte (Chiaro di luna)',
    icon: 'Moon',
    ambientColor: '#1A2233',
    ambientIntensity: 0.25,
    directColor: '#A5C0E6',
    directIntensity: 0.7,
    bgColor: '#0C0F14',
    tableColor: '#121720',
    tableRoughness: 0.55
  },
  {
    id: 'scene-interno',
    name: 'Interno (Showroom Accogliente)',
    icon: 'Sunset',
    ambientColor: '#423225',
    ambientIntensity: 0.65,
    directColor: '#FFA347',
    directIntensity: 1.4,
    bgColor: '#1F1712',
    tableColor: '#281E18',
    tableRoughness: 0.85
  }
];

export const DEFAULT_BOARD_ELEMENTS: BoardElement[] = [
  {
    id: 'default-marmo',
    name: 'Marmo Statuario (Campione)',
    shape: 'tile',
    color: '#fafafa',
    textureUrl: 'https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&q=80&w=600',
    textureName: 'Marmo Statuario',
    roughness: 0.15,
    metalness: 0.25,
    opacity: 1,
    position: [-1.2, 0.02, -0.6],
    rotation: [0, -15, 0],
    scale: [1.6, 0.04, 2.2]
  },
  {
    id: 'default-oak',
    name: 'Listello Rovere',
    shape: 'tile',
    color: '#deb887',
    textureUrl: 'https://images.unsplash.com/photo-1541123437800-1bb1317badc2?auto=format&fit=crop&q=80&w=600',
    textureName: 'Rovere Naturale',
    roughness: 0.5,
    metalness: 0.05,
    opacity: 1,
    position: [0.3, 0.03, -0.8],
    rotation: [0, 8, 0],
    scale: [0.6, 0.06, 2.6]
  },
  {
    id: 'default-velvet',
    name: 'Cerchio Velluto Salvia',
    shape: 'circle',
    color: '#4f5d50',
    textureUrl: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&q=80&w=600',
    textureName: 'Velluto Salvia',
    roughness: 0.7,
    metalness: 0.1,
    opacity: 1,
    position: [-0.1, 0.04, 0.6],
    rotation: [0, 45, 0],
    scale: [1.4, 0.08, 1.4]
  },
  {
    id: 'default-brass',
    name: 'Dettaglio Ottone',
    shape: 'cylinder',
    color: '#dfb76c',
    roughness: 0.25,
    metalness: 0.95,
    opacity: 1,
    position: [1.3, 0.10, 0.4],
    rotation: [0, 0, 0],
    scale: [0.4, 0.2, 0.4]
  }
];
