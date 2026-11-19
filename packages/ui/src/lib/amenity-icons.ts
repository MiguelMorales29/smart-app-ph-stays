import { createElement, type ComponentType, type SVGProps } from 'react';
import { barbecue, bedBunk, hairdryer, iron, kettle, towelFolded } from '@lucide/lab';
import {
  AirVentIcon,
  BathIcon,
  BedDoubleIcon,
  BikeIcon,
  BookOpenIcon,
  Building2Icon,
  CarIcon,
  ChefHatIcon,
  CigaretteOffIcon,
  CircleDotIcon,
  CoffeeIcon,
  CookingPotIcon,
  CctvIcon,
  Dice5Icon,
  DumbbellIcon,
  FanIcon,
  FlameIcon,
  FlameKindlingIcon,
  HeaterIcon,
  Icon,
  LaptopIcon,
  LockIcon,
  MicVocalIcon,
  MicrowaveIcon,
  ParkingSquareIcon,
  PawPrintIcon,
  ProjectorIcon,
  RefrigeratorIcon,
  ShieldCheckIcon,
  ShirtIcon,
  ShowerHeadIcon,
  SmileIcon,
  SnowflakeIcon,
  SparklesIcon,
  SunIcon,
  TrophyIcon,
  TvIcon,
  UtensilsIcon,
  WashingMachineIcon,
  WavesIcon,
  WifiIcon,
  type IconNode,
  type LucideIcon,
  type LucideProps,
} from 'lucide-react';

type AmenityIcon = ComponentType<LucideProps> | LucideIcon;

function labIcon(node: IconNode, name: string): AmenityIcon {
  function LabIcon(props: LucideProps) {
    return createElement(Icon, { iconNode: node, ...props });
  }
  LabIcon.displayName = `LabIcon(${name})`;
  return LabIcon;
}

/**
 * The one map from an amenity's `icon` value (Lucide names, as stored in `amenities.icon`) to its
 * icon (D54: Lucide plus @lucide/lab only). Hot tub and elevator have no icon anywhere, so they
 * use the nearest one; the word is always shown next to it.
 */
export const AMENITY_ICONS: Readonly<Record<string, AmenityIcon>> = {
  'air-vent': AirVentIcon,
  bath: BathIcon,
  'bed-double': BedDoubleIcon,
  'bed-bunk': labIcon(bedBunk, 'bed-bunk'),
  bike: BikeIcon,
  barbecue: labIcon(barbecue, 'barbecue'),
  'book-open': BookOpenIcon,
  'building-2': Building2Icon,
  car: CarIcon,
  cctv: CctvIcon,
  'chef-hat': ChefHatIcon,
  'cigarette-off': CigaretteOffIcon,
  'circle-dot': CircleDotIcon,
  coffee: CoffeeIcon,
  'cooking-pot': CookingPotIcon,
  'dice-5': Dice5Icon,
  dribbble: CircleDotIcon,
  dumbbell: DumbbellIcon,
  elevator: Building2Icon,
  fan: FanIcon,
  flame: FlameIcon,
  'flame-kindling': FlameKindlingIcon,
  hairdryer: labIcon(hairdryer, 'hairdryer'),
  heater: HeaterIcon,
  'hot-tub': WavesIcon,
  iron: labIcon(iron, 'iron'),
  kettle: labIcon(kettle, 'kettle'),
  laptop: LaptopIcon,
  lock: LockIcon,
  'mic-vocal': MicVocalIcon,
  microwave: MicrowaveIcon,
  parking: ParkingSquareIcon,
  'paw-print': PawPrintIcon,
  projector: ProjectorIcon,
  refrigerator: RefrigeratorIcon,
  'shield-check': ShieldCheckIcon,
  shirt: ShirtIcon,
  'shower-head': ShowerHeadIcon,
  smile: SmileIcon,
  snowflake: SnowflakeIcon,
  sparkles: SparklesIcon,
  sun: SunIcon,
  towel: labIcon(towelFolded, 'towel'),
  trophy: TrophyIcon,
  tv: TvIcon,
  utensils: UtensilsIcon,
  'washing-machine': WashingMachineIcon,
  waves: WavesIcon,
  wifi: WifiIcon,
};

/** The icon for an amenity, or a neutral dot for an unknown name (owner-added amenities). */
export function amenityIcon(name: string): AmenityIcon {
  return AMENITY_ICONS[name] ?? CircleDotIcon;
}

export type { AmenityIcon };
export type AmenityIconProps = SVGProps<SVGSVGElement>;
