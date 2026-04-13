"use client";

import { useTransition, useState } from "react";
import { loginAction } from "./actions";
import Image from "next/image";
import { Eye, EyeOff, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);

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
    <div className="min-h-screen w-full flex bg-slate-50 dark:bg-[#0F172A] text-slate-900 dark:text-slate-100 font-sans overflow-hidden transition-colors duration-300">
      {/* Left Column - Branding & Stats */}
      <div className="hidden lg:flex w-1/2 relative flex-col items-center justify-center overflow-hidden border-r border-slate-200 dark:border-slate-700/60 shadow-[1px_0_0_0_rgba(0,0,0,0.1)]">
        {/* Subtle dot pattern background */}
        <div
          className="absolute inset-0 opacity-[0.04] dark:opacity-20 pointer-events-none bg-[radial-gradient(#000_1px,transparent_1px)] dark:bg-[radial-gradient(rgba(255,255,255,0.15)_1px,transparent_1px)] bg-[size:32px_32px]"
        />

        {/* Soft radial glow in center */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[600px] h-[600px] bg-blue-500/5 dark:bg-blue-600/10 blur-[120px] rounded-full" />
        </div>

        {/* Center Logo Area */}
        <div className="relative z-10 flex flex-col items-center animate-in zoom-in duration-700">
          <Image 
            src="/logo.png" 
            alt="COMPERS Logo" 
            width={280} 
            height={120} 
            quality={95} 
            priority
            className="mb-6 w-auto h-auto object-contain drop-shadow-2xl dark:brightness-0 dark:invert" 
          />
          <p className="text-[10px] tracking-[0.3em] text-slate-500 font-medium uppercase ml-2">Sistema de Logística</p>
        </div>
      </div>

      {/* Right Column - Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center relative px-6 py-12">

        {/* Additional right column background subtle glow */}
        <div className="absolute right-0 top-0 w-full h-full bg-gradient-to-l from-blue-100/50 dark:from-blue-900/5 to-transparent pointer-events-none" />

        <div className="w-full max-w-[420px] bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-700/80 rounded-[1.75rem] p-9 shadow-2xl relative z-10 transition-colors duration-300 ring-1 ring-slate-200/50 dark:ring-white/5">
          {/* Header */}
          <div className="mb-8">
            <h2 className="text-[1.75rem] font-bold text-slate-900 dark:text-white mb-1 tracking-tight">Bienvenido</h2>
            <p className="text-slate-500 dark:text-[#64748B] text-xs">Ingresa tus credenciales para continuar</p>
          </div>

          <form action={handleSubmit} className="space-y-4">
            <div className="space-y-3">
              <div>
                <input
                  name="username"
                  type="text"
                  placeholder="Usuario"
                  required
                  className="w-full h-[52px] bg-slate-50 dark:bg-[#1E293B]/50 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-[#64748B] rounded-xl px-5 text-[14px] focus:outline-none focus:ring-1 focus:ring-blue-500/30 dark:focus:ring-blue-500/50 focus:border-blue-500/30 dark:focus:border-blue-500/50 transition-all font-medium"
                />
              </div>

              <div className="relative">
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Contraseña"
                  required
                  className="w-full h-[52px] bg-slate-50 dark:bg-[#1E293B]/50 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-[#64748B] rounded-xl px-5 text-[14px] pr-12 focus:outline-none focus:ring-1 focus:ring-blue-500/30 dark:focus:ring-blue-500/50 focus:border-blue-500/30 dark:focus:border-blue-500/50 transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-[#64748B] hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                </button>
              </div>

              {error && (
                <div className="text-sm text-red-500 dark:text-red-400 p-3 bg-red-50 dark:bg-red-400/10 rounded-lg border border-red-200 dark:border-red-400/20 text-center animate-in slide-in-from-top-1">
                  {error}
                </div>
              )}
            </div>

            <button
              type="submit"
              className="w-full h-[52px] bg-blue-600 hover:bg-blue-700 dark:bg-[#2257D5] dark:hover:bg-[#2563EB] text-white rounded-xl text-[14px] font-medium flex items-center justify-center gap-2 group transition-all active:scale-[0.98] mt-4 shadow-[0_4px_14px_0_rgba(37,99,235,0.25)] dark:shadow-[0_4px_14px_0_rgba(37,99,235,0.2)]"
              disabled={isPending}
            >
              <span className="group-hover:-translate-x-1 transition-transform duration-300">
                {isPending ? "Iniciando..." : "Ingresar"}
              </span>
              {!isPending && (
                <ArrowRight className="w-4 h-4 opacity-70 group-hover:translate-x-1 group-hover:opacity-100 transition-all duration-300" />
              )}
            </button>

            {/* Test accounts merged seamlessly */}
            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800/60">
              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                <div className="bg-slate-50 dark:bg-[#1E293B]/30 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800/40 flex flex-col gap-1 items-center">
                  <span className="text-slate-500 dark:text-[#64748B]">Logística</span>
                  <span className="font-mono text-blue-600 dark:text-[#3B82F6]">logistica/123</span>
                </div>
                <div className="bg-slate-50 dark:bg-[#1E293B]/30 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800/40 flex flex-col gap-1 items-center">
                  <span className="text-slate-500 dark:text-[#64748B]">Chofer</span>
                  <span className="font-mono text-emerald-600 dark:text-[#10B981]">chofer/123</span>
                </div>
                <div className="bg-slate-50 dark:bg-[#1E293B]/30 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800/40 flex flex-col gap-1 items-center">
                  <span className="text-slate-500 dark:text-[#64748B]">Guardia</span>
                  <span className="font-mono text-amber-600 dark:text-[#F59E0B]">guardia/123</span>
                </div>
                <div className="bg-slate-50 dark:bg-[#1E293B]/30 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800/40 flex flex-col gap-1 items-center">
                  <span className="text-slate-500 dark:text-[#64748B]">Cajas</span>
                  <span className="font-mono text-rose-600 dark:text-[#F43F5E]">cajas/123</span>
                </div>
                <div className="bg-slate-50 dark:bg-[#1E293B]/30 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800/40 flex flex-col gap-1 items-center">
                  <span className="text-slate-500 dark:text-[#64748B]">Admin</span>
                  <span className="font-mono text-violet-600 dark:text-[#8B5CF6]">admin/123</span>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
