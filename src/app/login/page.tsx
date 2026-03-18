"use client";

import { useTransition, useState } from "react";
import { loginAction } from "./actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lock, User } from "lucide-react";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (formData: FormData) => {
    setError(null);
    startTransition(async () => {
      const result = await loginAction(formData);
      if (result?.error) {
        setError(result.error);
      }
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0F172A] p-4 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in duration-500">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-primary/10 dark:bg-primary/20 flex items-center justify-center rounded-2xl mb-4">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight mb-2">Bienvenido</h1>
          <p className="text-slate-500 dark:text-slate-400">Ingresa tus credenciales para continuar</p>
        </div>

        <form action={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-slate-700 dark:group-focus-within:text-slate-300 transition-colors" />
              <Input
                name="username"
                type="text"
                placeholder="Usuario"
                required
                className="pl-12 h-14 text-[15px] font-semibold text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 focus-visible:ring-[3px] focus-visible:ring-slate-300/50 dark:focus-visible:ring-slate-600/50 shadow-sm"
              />
            </div>
            
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-slate-700 dark:group-focus-within:text-slate-300 transition-colors" />
              <Input
                name="password"
                type="password"
                placeholder="Contraseña"
                required
                className="pl-12 h-14 text-[15px] font-bold tracking-wider text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 focus-visible:ring-[3px] focus-visible:ring-slate-300/50 dark:focus-visible:ring-slate-600/50 shadow-sm"
              />
            </div>
            
            {error && (
              <div className="text-sm text-destructive dark:text-red-400 text-center animate-in slide-in-from-top-1">
                {error}
              </div>
            )}
          </div>

          <Button 
            type="submit" 
            className="w-full h-14 rounded-xl text-[15px] font-semibold shadow-md active:scale-[0.98] transition-all"
            disabled={isPending}
          >
            {isPending ? "Iniciando sesión..." : "Iniciar Sesión"}
          </Button>

          <div className="text-center text-sm text-slate-500 dark:text-slate-400 mt-6">
            <p><strong>Cuentas de prueba:</strong></p>
            <p className="mt-1">Logística: logistica / 123</p>
            <p>Chofer: chofer / 123</p>
          </div>
        </form>
      </div>
    </div>
  );
}
