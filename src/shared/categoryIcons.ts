import {
  Banknote,
  Car,
  CirclePlus,
  Ellipsis,
  Gift,
  GraduationCap,
  HeartPulse,
  House,
  PartyPopper,
  PiggyBank,
  Plane,
  Repeat,
  ShoppingBag,
  Target,
  Utensils,
  type LucideIcon,
} from 'lucide-react-native';

// `categories.icon` (e `goals.icon`) guarda o nome do ícone Lucide; aqui ele vira o componente.
export const categoryIcons: Record<string, LucideIcon> = {
  House,
  Utensils,
  Car,
  HeartPulse,
  PartyPopper,
  ShoppingBag,
  Repeat,
  GraduationCap,
  Ellipsis,
  Banknote,
  CirclePlus,
  // ícones das metas
  PiggyBank,
  Plane,
  Gift,
  Target,
};
