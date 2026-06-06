/**
 * Dashboard Icon System
 * Centralized premium monoline icon references
 * All from lucide-react: thin stroke (1.5), inherit color
 */

import {
  Home,
  Network,
  Users,
  Target,
  TrendingUp,
  Wallet,
  Gift,
  MessageSquare,
  Award,
  Settings,
  LogOut,
  Eye,
  Download,
  Share2,
  Copy,
  ChevronRight,
  ChevronDown,
  Plus,
  X,
  Search,
  Filter,
  Edit,
  Trash2,
  Clock,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  MoreVertical,
  Zap,
  Lock,
  Unlock,
  Bell,
  Calendar,
  MapPin,
  Mail,
  Phone,
  ExternalLink,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  BarChart3,
  PieChart,
  LineChart,
  DollarSign,
  CreditCard,
  ShoppingCart,
  Package,
  Truck,
  Shield,
  Flag,
  Star,
  Heart,
  BookOpen,
  Code,
  Database,
  Server,
  Wifi,
  Link as LinkIcon,
  Repeat,
  RefreshCw,
} from 'lucide-react';

export const DASHBOARD_ICONS = {
  // Navigation
  home: Home,
  network: Network,
  people: Users,
  target: Target,
  trending: TrendingUp,
  wallet: Wallet,
  gift: Gift,
  chat: MessageSquare,
  rank: Award,
  settings: Settings,
  logout: LogOut,

  // Actions
  view: Eye,
  download: Download,
  share: Share2,
  copy: Copy,
  edit: Edit,
  delete: Trash2,
  add: Plus,
  close: X,
  search: Search,
  filter: Filter,

  // Status
  time: Clock,
  success: CheckCircle,
  alert: AlertCircle,
  help: HelpCircle,
  more: MoreVertical,

  // Premium
  energy: Zap,
  locked: Lock,
  unlocked: Unlock,
  notification: Bell,
  calendar: Calendar,
  location: MapPin,
  email: Mail,
  phone: Phone,
  external: ExternalLink,

  // Direction
  right: ArrowRight,
  up: ArrowUp,
  down: ArrowDown,
  chevronRight: ChevronRight,
  chevronDown: ChevronDown,

  // Analytics
  barChart: BarChart3,
  pieChart: PieChart,
  lineChart: LineChart,

  // Finance
  money: DollarSign,
  card: CreditCard,
  cart: ShoppingCart,
  package: Package,
  truck: Truck,

  // Security
  shield: Shield,
  flag: Flag,

  // Engagement
  star: Star,
  heart: Heart,

  // Development
  book: BookOpen,
  code: Code,
  database: Database,
  server: Server,
  wifi: Wifi,
  link: LinkIcon,
  repeat: Repeat,
  refresh: RefreshCw,
};

/**
 * Icon size presets
 */
export const ICON_SIZES = {
  xs: 14,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
};

/**
 * Icon stroke width
 */
export const ICON_STROKE = 1.5;

/**
 * Helper to get icon by name
 */
export function getIcon(name) {
  return DASHBOARD_ICONS[name] || null;
}