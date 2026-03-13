export type Status = 'pending' | 'in-progress' | 'ready' | 'none';

export interface MaterialDetail {
  warehouse: string;
  name: string;
  quantity: number;
  weight: number; // in kg
  status: Status;
}

export interface ChoferRow {
  id: string;
  date: string;
  clientName: string;
  clientPhone: string;
  destination: string;
  materials: {
    aluminio: MaterialDetail[];
    vidrio: MaterialDetail[];
    herrajes: MaterialDetail[];
  };
}

export const MOCK_CHOFER_DATA: ChoferRow[] = [
  {
    id: "1024",
    date: "24 de febrero 2026",
    clientName: "Cliente 2",
    clientPhone: "81 1234 5678",
    destination: "Av. de los Leones 123, Monterrey",
    materials: {
      aluminio: [
        { warehouse: "Almacén Norte", name: "Perfil de Aluminio 4x4", quantity: 15, weight: 120.5, status: 'ready' },
        { warehouse: "Almacén Norte", name: "Tubo Redondo 2 pulg", quantity: 5, weight: 35.0, status: 'ready' }
      ],
      vidrio: [
        { warehouse: "Almacén Central", name: "Cristal Templado 6mm", quantity: 4, weight: 85.0, status: 'ready' }
      ],
      herrajes: []
    }
  },
  {
    id: "1021",
    date: "22 de febrero 2026",
    clientName: "Cliente 4",
    clientPhone: "81 8765 4321",
    destination: "Calle Pino Suárez 45B, San Pedro",
    materials: {
      aluminio: [
        { warehouse: "Almacén Sur", name: "Marco Estándar Aluminio", quantity: 10, weight: 45.2, status: 'ready' }
      ],
      vidrio: [
        { warehouse: "Almacén Central", name: "Vidrio Esmerilado 4mm", quantity: 2, weight: 30.0, status: 'pending' },
        { warehouse: "Almacén Central", name: "Cristal Claro 3mm", quantity: 6, weight: 40.5, status: 'ready' }
      ],
      herrajes: [
        { warehouse: "Almacén Este", name: "Bisagra Hidráulica", quantity: 20, weight: 15.5, status: 'in-progress' },
        { warehouse: "Almacén Este", name: "Manija de Acero", quantity: 10, weight: 5.0, status: 'pending' }
      ]
    }
  },
  {
    id: "1018",
    date: "20 de febrero 2026",
    clientName: "Cliente 6",
    clientPhone: "81 5555 4444",
    destination: "Carretera Nacional Km 265",
    materials: {
      aluminio: [],
      vidrio: [
        { warehouse: "Almacén Central", name: "Luna Espejo 4mm", quantity: 8, weight: 64.0, status: 'ready' },
        { warehouse: "Almacén Central", name: "Cristal Filtrasol", quantity: 3, weight: 45.0, status: 'in-progress' }
      ],
      herrajes: [
        { warehouse: "Almacén Este", name: "Chapetón Inoxidable", quantity: 50, weight: 8.0, status: 'ready' }
      ]
    }
  }
];
