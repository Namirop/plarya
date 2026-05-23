import { ToastProvider } from "@/components/ui/toast-provider";

// Layout dédié au scope /admin pour câbler le ToastProvider sans
// polluer le layout root (les autres routes n'utilisent pas useToast
// pour l'instant). Si d'autres routes en ont besoin plus tard, on
// promeut le provider dans app/layout.tsx.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <ToastProvider>{children}</ToastProvider>;
}
