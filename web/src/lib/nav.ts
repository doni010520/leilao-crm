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
  Tag,
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
      { href: "/relatorios", label: "Relatórios", icon: BarChart3 },
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
      { href: "/ajustes/ia", label: "Agente de IA", icon: Sparkles },
      { href: "/canais", label: "Canais WhatsApp", icon: Radio },
      { href: "/automacoes", label: "Automações", icon: Bot },
      { href: "/campanhas", label: "Campanhas", icon: Megaphone },
    ],
  },
  {
    title: "Empresa",
    items: [
      { href: "/empresa", label: "Dados da empresa", icon: Building2 },
      { href: "/atendentes", label: "Atendentes", icon: Users },
      { href: "/departamentos", label: "Departamentos", icon: Layers },
      { href: "/ajustes", label: "Ajustes", icon: Settings },
    ],
  },
];

export const ALL_ITEMS: NavItem[] = NAV.flatMap((g) => g.items);
