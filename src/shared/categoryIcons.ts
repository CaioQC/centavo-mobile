import {
  Banknote,
  Car,
  CirclePlus,
  Ellipsis,
  GraduationCap,
  HeartPulse,
  House,
  PartyPopper,
  Repeat,
  ShoppingBag,
  Utensils,
  type LucideIcon,
} from 'lucide-react-native';

// `categories.icon` guarda o nome do ícone Lucide; aqui ele vira o componente.
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
};
