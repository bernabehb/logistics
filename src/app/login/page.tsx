"use client";

import { useTransition, useState, useEffect } from "react";
import { loginAction } from "./actions";
import Image from "next/image";
import { Eye, EyeOff, ArrowRight, Truck, Package, MapPin, RotateCcw, Route, ClipboardList, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 5);
    }, 2000); // Avanza de parada cada 2 segundos
    return () => clearInterval(timer);
  }, []);

  const stepDetails = [
    { label: "Asignación de bloques", status: "Bloque", desc: "Planificando carga y asignando bloques de entrega.", icon: ClipboardList },
    { label: "Autorización de ruta", status: "Verificando", desc: "Obteniendo permisos de ruta y chequeo de seguridad.", icon: ShieldCheck },
    { label: "Escaneo de facturas", status: "Cargando", desc: "Escaneando remisiones y cargando unidad COMPERS.", icon: Package },
    { label: "En Ruta", status: "En Carretera", desc: "Unidad 204 viajando en autopista CDMX - MTY.", icon: Route },
    { label: "Entrega de material", status: "Repartiendo", desc: "Descargando mercancía en sucursales autorizadas.", icon: MapPin }
  ];

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
      <div className="hidden lg:flex w-1/2 relative flex-col items-center justify-center overflow-hidden border-r border-slate-200 dark:border-slate-700/60 shadow-[1px_0_0_0_rgba(0,0,0,0.1)] animate-fade-in">
        {/* Subtle dot pattern background */}
        <div
          className="absolute inset-0 opacity-[0.04] dark:opacity-20 pointer-events-none bg-[radial-gradient(#000_1px,transparent_1px)] dark:bg-[radial-gradient(rgba(255,255,255,0.15)_1px,transparent_1px)] bg-[size:32px_32px]"
        />

        {/* Soft radial glow in center */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[600px] h-[600px] bg-blue-500/5 dark:bg-blue-600/10 blur-[120px] rounded-full" />
        </div>

        {/* Center Logo Area & Operational Flow Container */}
        <div className="relative z-10 w-full max-w-[780px] flex flex-col items-center justify-center select-none gap-10">

          {/* Main Glowing Backdrop behind Logo */}
          <div className="absolute w-[240px] h-[240px] bg-blue-500/10 dark:bg-blue-600/15 rounded-full blur-[60px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />

          {/* Center Logo Area */}
          <div className="relative flex flex-col items-center animate-in zoom-in duration-700">
            <Image
              src="/logo.png"
              alt="COMPERS Logo"
              width={350}
              height={150}
              quality={95}
              priority
              className="mb-6 w-[240px] sm:w-[350px] h-auto object-contain drop-shadow-2xl dark:brightness-0 dark:invert"
            />
            <p className="text-[10px] tracking-[0.3em] text-slate-500 dark:text-slate-400 font-semibold uppercase ml-2">Sistema de Logística</p>
          </div>

          {/* Operational Flow "Carretera" - Centered under the logo */}
          <div className="w-full px-6 transition-all duration-300">
            {/* Steps & Road Flow */}
            <div className="w-full relative py-2">
              {/* Highway track graphic */}
              <div className="absolute top-[26px] left-[6%] right-[6%] h-3 bg-slate-100 dark:bg-slate-800/80 rounded-full border border-slate-200/5 dark:border-slate-700/20 shadow-inner flex items-center pointer-events-none">
                {/* Yellow Dashed Center Line */}
                <div className="w-full h-px border-t border-dashed border-amber-400/60 dark:border-amber-400/40" />
                {/* Progress highlight on road */}
                <div
                  className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-blue-500/20 to-blue-500/40 dark:from-blue-500/15 dark:to-blue-500/30 rounded-full transition-all duration-1000 ease-in-out"
                  style={{ width: `${activeStep * 22 + 6}%` }}
                />
              </div>

              {/* Moving Truck on Road */}
              <div
                className="absolute top-[12px] w-10 h-10 rounded-full bg-blue-500/15 dark:bg-blue-400/10 border border-blue-500/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-[0_0_15px_rgba(37,99,235,0.15)] backdrop-blur-sm z-20 transition-all duration-1000 ease-in-out"
                style={{
                  left: `calc(${activeStep * 22 + 6}% - 20px)`
                }}
              >
                <span className="absolute -inset-1 bg-blue-500/10 rounded-full animate-ping" />
                <Truck className="w-4.5 h-4.5 animate-truck-drive" />
              </div>

              {/* Stepper Milestones */}
              <div className="relative flex justify-between z-10">
                {stepDetails.map((step, index) => {
                  const Icon = step.icon;
                  const isCompleted = activeStep > index;
                  const isActive = activeStep === index;

                  return (
                    <div key={index} className="flex flex-col items-center w-[18%]">
                      <div className={`w-9 h-9 rounded-full border flex items-center justify-center transition-all duration-500 ${isCompleted
                        ? 'bg-emerald-500/15 border-emerald-500 text-emerald-600 dark:text-emerald-400 shadow-sm'
                        : isActive
                          ? 'bg-blue-500/10 border-blue-500 text-blue-600 dark:text-blue-400 shadow-sm'
                          : 'bg-slate-50 dark:bg-[#1E293B] border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500'
                        }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-[7px] sm:text-[8px] font-bold text-slate-700 dark:text-slate-300 mt-2 text-center leading-tight">
                        {step.label}
                      </span>
                      <span className={`text-[6px] sm:text-[7px] font-bold mt-0.5 ${isCompleted ? 'text-emerald-500' : isActive ? 'text-blue-500' : 'text-slate-400'
                        }`}>
                        {isCompleted ? 'Completado' : isActive ? 'En proceso' : 'Pendiente'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column - Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center relative px-6 py-12 min-h-screen">

        {/* Additional right column background subtle glow */}
        <div className="absolute right-0 top-0 w-full h-full bg-gradient-to-l from-blue-100/50 dark:from-blue-900/5 to-transparent pointer-events-none" />

        <div className="w-full max-w-[420px] bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-700/80 rounded-[1.75rem] p-6 sm:p-9 shadow-2xl relative z-10 transition-colors duration-300 ring-1 ring-slate-200/50 dark:ring-white/5">
          {/* Header */}
          <div className="mb-8">
            {/* Mobile Logo */}
            <div className="lg:hidden flex justify-center mb-6">
              <Image
                src="/logo.png"
                alt="COMPERS Logo"
                width={200}
                height={85}
                quality={95}
                priority
                className="w-auto h-12 object-contain dark:brightness-0 dark:invert"
              />
            </div>
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
            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800/60">
              <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-center text-[12px] text-slate-500 dark:border-slate-800/40 dark:bg-[#1E293B]/30 dark:text-slate-400">
                Usa tu usuario y contraseña registrados en Compers.
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

