import { ToastProvider } from "@/components/ui/toast-provider";

// ToastProvider limité à /admin, seule route qui utilise useToast.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <ToastProvider>{children}</ToastProvider>;
}
