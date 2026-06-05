import {
  LayoutDashboard,
  BarChart3,
  MessageSquareText,
  Radio,
  Bot,
  Megaphone,
  Users,
  Layers,
  Settings,
  Building2,
  Home,
  Kanban,
  Handshake,
  ClipboardList,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  adminOnly?: boolean;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

export const NAV: NavGroup[] = [
  {
    title: "Geral",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/relatorios", label: "Relatórios", icon: BarChart3, adminOnly: true },
    ],
  },
  {
    title: "Leilão",
    items: [
      { href: "/pipeline", label: "Pipeline", icon: Kanban },
      { href: "/imoveis", label: "Imóveis", icon: Home },
      { href: "/negocios", label: "Negócios", icon: Handshake },
      { href: "/tarefas", label: "Tarefas", icon: ClipboardList },
    ],
  },
  {
    title: "Atendimento",
    items: [
      { href: "/atendimento", label: "Inbox", icon: MessageSquareText },
      { href: "/ajustes/ia", label: "Agente de IA", icon: Sparkles, adminOnly: true },
      { href: "/canais", label: "Canais WhatsApp", icon: Radio, adminOnly: true },
      { href: "/automacoes", label: "Automações", icon: Bot, adminOnly: true },
      { href: "/campanhas", label: "Campanhas", icon: Megaphone, adminOnly: true },
    ],
  },
  {
    title: "Empresa",
    items: [
      { href: "/empresa", label: "Dados da empresa", icon: Building2, adminOnly: true },
      { href: "/atendentes", label: "Atendentes", icon: Users, adminOnly: true },
      { href: "/departamentos", label: "Departamentos", icon: Layers, adminOnly: true },
      { href: "/ajustes", label: "Ajustes", icon: Settings, adminOnly: true },
    ],
  },
];

export function getNavForRole(role: string): NavGroup[] {
  const isAdmin = role === "admin" || role === "supervisor";
  return NAV
    .map(group => ({
      ...group,
      items: group.items.filter(item => !item.adminOnly || isAdmin),
    }))
    .filter(group => group.items.length > 0);
}

export const ALL_ITEMS: NavItem[] = NAV.flatMap((g) => g.items);
