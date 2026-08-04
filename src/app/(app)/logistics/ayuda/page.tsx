"use client";

import { useState } from "react";
import { 
  KeyRound, 
  LayoutDashboard, 
  Workflow, 
  Layers, 
  Map, 
  ClipboardCheck, 
  Truck, 
  MapPin, 
  ShieldCheck, 
  HelpCircle, 
  Search,
  ExternalLink,
  ArrowRight,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { Input } from "@/components/ui/input";

interface HelpTopic {
  id: number;
  title: string;
  headingId: string;
  icon: any;
  description: string;
  tags: string[];
}

interface FAQItem {
  id: number;
  question: string;
  answer: string;
  tags: string[];
}

const BASE_DOC_URL = "https://docs.google.com/document/d/1rMfAUlavR3lFX9Yb8Ig6s70l1t5TPvtze8nPyMUV1to/edit?tab=t.0";

const helpTopics: HelpTopic[] = [
  {
    id: 1,
    title: "Inicio de Sesión",
    headingId: "h.cwj5yj6dxley",
    icon: KeyRound,
    description: "Aprende a ingresar al sistema de forma segura utilizando tus credenciales asignadas de logística o guardia.",
    tags: ["login", "sesion", "seguridad", "acceso"]
  },
  {
    id: 2,
    title: "Vista General del Sistema",
    headingId: "h.kgk52kh2u8pl",
    icon: LayoutDashboard,
    description: "Conoce la interfaz de usuario, navegación general, menús e indicadores clave de rendimiento (KPIs).",
    tags: ["interfaz", "general", "dashboard", "menu"]
  },
  {
    id: 3,
    title: "Flujo General de Trabajo",
    headingId: "h.csh805z7mvh3",
    icon: Workflow,
    description: "Revisa el proceso de extremo a extremo, desde la planeación de rutas hasta la validación de entrega final.",
    tags: ["flujo", "proceso", "operaciones", "operacion", "crear rutas", "creacion de rutas", "hacer rutas", "como crear rutas", "armar ruta", "iniciar ruta"]
  },
  {
    id: 4,
    title: "Asignación de Bloques",
    headingId: "h.2vs40l63xjzk",
    icon: Layers,
    description: "Aprende a agrupar pedidos y programar la carga de mercancías mediante la asignación de bloques.",
    tags: ["bloques", "carga", "pedidos", "asignar"]
  },
  {
    id: 5,
    title: "Gestión de Rutas",
    headingId: "h.lkah7kmuze0t",
    icon: Map,
    description: "Organiza, edita y supervisa los recorridos óptimos y la logística de entrega para los operadores.",
    tags: ["rutas", "mapa", "recorrido", "operadores", "crear rutas", "creacion de rutas", "hacer rutas", "como crear rutas", "gestion de rutas", "armar ruta", "modificar ruta"]
  },
  {
    id: 6,
    title: "Autorizar Salida",
    headingId: "h.mayipxtxkn9j",
    icon: ClipboardCheck,
    description: "Proceso obligatorio para verificar cargamento, chofer y unidad antes de autorizar la salida de almacén.",
    tags: ["salida", "autorizacion", "guardia", "cedis"]
  },
  {
    id: 7,
    title: "Unidades",
    headingId: "h.lf43aob868ir",
    icon: Truck,
    description: "Consulta el catálogo de vehículos, tipos de capacidad, placas y estatus operacional de cada transporte.",
    tags: ["unidades", "camiones", "transporte", "vehiculos"]
  },
  {
    id: 8,
    title: "Entrega de Material en Sucursal",
    headingId: "h.tpf70820781",
    icon: MapPin,
    description: "Protocolo de descarga, firma de documentación y control físico de la mercancía recibida en cada sucursal.",
    tags: ["sucursal", "entrega", "descarga", "material"]
  },
  {
    id: 9,
    title: "Autorizar salida en sucursal",
    headingId: "h.wvxfsysr0lfy",
    icon: ShieldCheck,
    description: "Pasos de seguridad y validaciones para registrar la liberación del vehículo de las instalaciones sucursales.",
    tags: ["sucursal", "salida", "liberacion", "seguridad"]
  }
];

const faqItems: FAQItem[] = [
  {
    id: 1,
    question: "¿Por qué asigné un bloque a un chofer y en Rutas no me permite autorizar?",
    answer: "Esto puede pasar por dos razones principales:\n1. No se ha seleccionado la sucursal en el filtro superior.\n2. El chofer no tiene una unidad asignada desde Samsara.\n\nPara solucionarlo, primero seleccione la sucursal correspondiente en la pantalla Rutas.\nSi el bloque aparece como \"Sin Unidad\", el chofer debe seleccionar una unidad desde la aplicación móvil Samsara Driver.\nDespués de que el chofer seleccione la unidad, se debe liberar el bloque desde la pantalla Bloques y volver a realizar la asignación. Al asignarlo nuevamente, el sistema tomará la unidad actualizada desde Samsara.",
    tags: ["bloque", "chofer", "rutas", "autorizar", "samsara", "sin unidad"]
  },
  {
    id: 2,
    question: "¿Qué hago si necesito asignar un ayudante y no aparece en la lista?",
    answer: "Si el ayudante no aparece en las opciones disponibles, seleccione la opción \"Otro\" y escriba el nombre completo del ayudante. El sistema guardará ese nombre en la asignación correspondiente.",
    tags: ["ayudante", "lista", "otro", "asignar"]
  },
  {
    id: 3,
    question: "¿Por qué no aparece una factura en Rutas?",
    answer: "Puede deberse a que la factura no corresponde a la sucursal seleccionada, aún no está lista para ruta o ya fue autorizada anteriormente. También puede pasar si está usando el filtro incorrecto, por ejemplo Domicilio o Sucursal.",
    tags: ["factura", "rutas", "sucursal", "filtro", "domicilio"]
  },
  {
    id: 4,
    question: "¿Por qué una factura aparece en Anteriores?",
    answer: "Una factura aparece en Anteriores cuando quedó pendiente de días pasados y aún no ha sido enviada o entregada. Estas facturas pueden seleccionarse junto con facturas del día actual para armar una nueva ruta.",
    tags: ["factura", "anteriores", "pendiente", "dias pasados"]
  },
  {
    id: 5,
    question: "¿Qué hago si ya armé una ruta, pero llegó una nueva factura u orden para el mismo chofer?",
    answer: "Si la unidad todavía no está en ruta, no es necesario liberar el bloque. La mejor opción es usar el botón Regresar desde la pantalla Rutas. Después puede seleccionar nuevamente las facturas u órdenes, incluyendo la nueva, y volver a autorizar la ruta. Esto permite actualizar la ruta sin liberar la asignación del bloque.",
    tags: ["ruta", "nueva factura", "orden", "chofer", "regresar", "actualizar"]
  },
  {
    id: 6,
    question: "¿Qué hago si el cliente no recibe el material?",
    answer: "Si la factura ya está en ruta y el cliente no recibe el material, use el botón rojo de regresar en la factura. La factura volverá a aparecer en Rutas para poder incluirla en una nueva ruta, ya sea el mismo día o en otro día.",
    tags: ["cliente", "material", "regresar", "factura", "no recibe"]
  },
  {
    id: 7,
    question: "¿Qué hago si el cliente cambia la dirección de entrega?",
    answer: "Si el cliente solicita entregar el material en una dirección diferente, use el botón con icono de lápiz desde la pantalla Autorizar salida, en la sección En Ruta. Ahí podrá capturar la nueva dirección de entrega. Al guardar el cambio, el sistema actualiza la parada en Samsara sin afectar el progreso actual de la ruta.",
    tags: ["cliente", "direccion", "entrega", "lapiz", "en ruta", "samsara"]
  },
  {
    id: 8,
    question: "¿Por qué desapareció el card de una unidad en En Ruta?",
    answer: "El card desaparece cuando todas las facturas u órdenes de esa ruta ya fueron marcadas como entregadas. Esto indica que la ruta ya no tiene entregas pendientes dentro del sistema.",
    tags: ["card", "unidad", "en ruta", "desaparecio", "entregadas"]
  },
  {
    id: 9,
    question: "¿Cuándo debo usar Sincronizar entregas de la interfaz Autorizar salida?",
    answer: "Use Sincronizar entregas para actualizar el sistema con las entregas registradas desde Samsara. Cuando el chofer sube el documento de Entrega de Material en Samsara, el sistema puede detectar las facturas entregadas y marcarlas automáticamente.",
    tags: ["sincronizar", "entregas", "autorizar salida", "samsara"]
  },
  {
    id: 10,
    question: "¿Cuándo debo usar Marcar Entregado?",
    answer: "Este botón se utiliza únicamente cuando sea necesario cerrar manualmente la entrega desde el sistema. Normalmente, la entrega debe actualizarse mediante la sincronización con Samsara.",
    tags: ["marcar entregado", "manual", "cerrar", "samsara"]
  },
  {
    id: 11,
    question: "¿Por qué el botón Ver Ruta Samsara no carga la ruta?",
    answer: "Para poder ver la ruta en Samsara, es necesario tener la sesión iniciada en Samsara desde el navegador. Si no tiene sesión iniciada, Samsara puede mostrar una pantalla en blanco, pedir acceso o no cargar correctamente la ruta.",
    tags: ["ver ruta samsara", "samsara", "no carga", "sesion"]
  },
  {
    id: 12,
    question: "¿Dónde puedo ver el progreso de cada ruta?",
    answer: "El progreso de la ruta se puede consultar desde el botón Ver Ruta Samsara. Desde ahí se puede revisar el recorrido, las paradas programadas y el avance de la unidad.",
    tags: ["progreso", "ruta", "ver ruta samsara", "avance", "recorrido"]
  },
  {
    id: 13,
    question: "¿Por qué si mi sucursal es Monterrey me aparecen bloques de Apodaca o Guadalupe?",
    answer: "Esto puede pasar porque la sucursal está atendiendo o vendiendo a clientes que pertenecen a otro bloque. El bloque depende de la zona o ubicación del cliente, no necesariamente de la sucursal que realiza la venta.",
    tags: ["sucursal", "monterrey", "bloques", "apodaca", "guadalupe", "zona"]
  },
  {
    id: 14,
    question: "¿Por qué en mi sucursal aparece una vendedora de otra sucursal?",
    answer: "Puede suceder cuando una vendedora de otra sucursal está sacando material desde su sucursal para atender a un cliente. En ese caso, el pedido puede aparecer en la sucursal desde donde se surte el material.",
    tags: ["vendedora", "sucursal", "otra sucursal", "pedido"]
  }
];

export default function AyudaPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedFaqId, setExpandedFaqId] = useState<number | null>(null);

  const toggleFaq = (id: number) => {
    setExpandedFaqId(expandedFaqId === id ? null : id);
  };

  const normalize = (text: string) => {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  };

  const queryNormalized = normalize(searchQuery).trim();
  const stopWords = ["como", "para", "de", "la", "el", "los", "las", "un", "una", "por", "que", "y", "en", "con", "del", "al"];
  const keywords = queryNormalized
    .split(/\s+/)
    .filter(word => word.length > 0 && !stopWords.includes(word));

  const searchTokens = keywords.length > 0 ? keywords : queryNormalized.split(/\s+/).filter(w => w.length > 0);

  const filteredTopics = helpTopics.filter((topic) => {
    if (!queryNormalized) return true;
    if (topic.id.toString() === queryNormalized) return true;

    const targetText = normalize(`${topic.title} ${topic.description} ${topic.tags.join(" ")}`);
    return searchTokens.every(token => targetText.includes(token));
  });

  const filteredFaqs = faqItems.filter((faq) => {
    if (!queryNormalized) return true;

    const targetText = normalize(`${faq.question} ${faq.answer} ${faq.tags.join(" ")}`);
    return searchTokens.every(token => targetText.includes(token));
  });

  return (
    <div className="flex-1 space-y-10 px-4 pt-0 pb-8 w-full">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-200/60 dark:border-slate-800/60">
        <div className="space-y-1 max-w-2xl">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Manual de Usuario
          </h1>
          <p className="text-slate-550 dark:text-slate-400 text-sm md:text-base">
            Selecciona el tema de tu interés para abrir la documentación detallada o consulta las preguntas frecuentes.
          </p>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400 dark:text-slate-500" />
          <Input
            type="text"
            placeholder="Buscar tema o duda..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2.5 w-full bg-white/60 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-900 dark:focus:ring-blue-500 focus:border-transparent transition-all shadow-inner text-sm"
          />
        </div>
      </div>

      {/* Grid containing the topics */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Temas de Capacitación</h2>
        {filteredTopics.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTopics.map((topic) => {
              const IconComponent = topic.icon;
              return (
                <a
                  key={topic.id}
                  href={`${BASE_DOC_URL}#heading=${topic.headingId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex flex-col justify-between p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-[#1E293B]/40 hover:bg-white dark:hover:bg-[#1E293B]/65 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-blue-900/30 dark:hover:border-blue-500/20 backdrop-blur-md relative overflow-hidden"
                >
                  {/* Visual Accent Hover Effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-900/[0.03] dark:from-blue-500/[0.02] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                  
                  <div>
                    <div className="flex items-start justify-between mb-5">
                      {/* Icon container */}
                      <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:bg-blue-900 dark:group-hover:bg-blue-800 group-hover:text-white transition-all duration-300 shadow-sm">
                        <IconComponent className="size-6" />
                      </div>
                      {/* Index badge */}
                      <span className="text-xs font-bold text-slate-400 dark:text-slate-500 bg-slate-100/60 dark:bg-slate-800/40 px-2.5 py-1 rounded-full">
                        Tema {topic.id}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-blue-900 dark:group-hover:text-blue-400 transition-colors mb-2.5 flex items-center gap-1.5">
                      {topic.title}
                    </h3>
                    
                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                      {topic.description}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-xs font-semibold text-blue-900 dark:text-blue-400 group-hover:underline">
                    <span className="flex items-center gap-1.5">
                      Abrir Guía
                      <ExternalLink className="size-3" />
                    </span>
                    <ArrowRight className="size-3.5 transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </a>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-10 bg-white/30 dark:bg-slate-950/20 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl backdrop-blur-md">
            <HelpCircle className="size-10 mx-auto text-slate-400 dark:text-slate-600 mb-3" />
            <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1">No se encontraron temas</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Intenta buscar con palabras clave diferentes.</p>
          </div>
        )}
      </div>

      {/* FAQ Section */}
      <div className="pt-6 border-t border-slate-200/60 dark:border-slate-800/60">
        <div className="flex flex-wrap items-center gap-3.5 mb-6">
          <HelpCircle className="size-6 text-blue-900 dark:text-blue-400 shrink-0" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white shrink-0">Preguntas Frecuentes (FAQ)</h2>
          <a
            href={`${BASE_DOC_URL}#heading=h.vk2obei6tjb1`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-900 dark:text-blue-400 hover:underline shrink-0 ml-1.5 mt-1"
          >
            (Abrir Guía)
            <ExternalLink className="size-3" />
          </a>
        </div>

        {filteredFaqs.length > 0 ? (
          <div className="space-y-4">
            {filteredFaqs.map((faq) => {
              const isOpen = expandedFaqId === faq.id;
              return (
                <div 
                  key={faq.id}
                  className="border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-[#1E293B]/30 rounded-xl overflow-hidden transition-all duration-350 shadow-sm hover:border-slate-300 dark:hover:border-slate-700"
                >
                  <button
                    onClick={() => toggleFaq(faq.id)}
                    className={`w-full flex items-center justify-between p-5 text-left text-sm md:text-base font-semibold transition-colors ${isOpen ? "text-blue-900 dark:text-blue-400" : "text-slate-900 dark:text-white hover:text-blue-900 dark:hover:text-blue-400"}`}
                  >
                    <span>{faq.question}</span>
                    {isOpen ? (
                      <ChevronUp className="size-5 text-blue-900 dark:text-blue-400 shrink-0 ml-3" />
                    ) : (
                      <ChevronDown className="size-5 text-slate-400 dark:text-slate-500 shrink-0 ml-3" />
                    )}
                  </button>

                  <div 
                    className={`transition-all duration-300 ease-in-out ${isOpen ? "max-h-[500px] border-t border-slate-200/50 dark:border-slate-800/50" : "max-h-0"} overflow-hidden`}
                  >
                    <div className="p-5 text-sm text-slate-600 dark:text-slate-400 bg-white/20 dark:bg-[#1E293B]/10 leading-relaxed whitespace-pre-wrap">
                      {faq.answer}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-10 bg-white/30 dark:bg-slate-950/20 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl backdrop-blur-md">
            <HelpCircle className="size-10 mx-auto text-slate-400 dark:text-slate-600 mb-3" />
            <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1">No se encontraron preguntas frecuentes</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Intenta buscar con palabras clave diferentes.</p>
          </div>
        )}
      </div>
    </div>
  );
}
