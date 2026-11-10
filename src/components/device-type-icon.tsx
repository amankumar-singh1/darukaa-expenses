import {
  AudioWaveform,
  Battery,
  Camera,
  Droplet,
  HardDrive,
  Package,
  Satellite,
  Thermometer,
  type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  audiomoth: AudioWaveform,
  hydromoth: Droplet,
  "camera trap": Camera,
  "environmental sensor": Thermometer,
  "gps unit": Satellite,
  "sd card": HardDrive,
  "battery pack": Battery,
};

export function deviceTypeIcon(type: string): LucideIcon {
  return ICONS[type.trim().toLowerCase()] ?? Package;
}
