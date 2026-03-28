export type DeliveryStatus = 'pending' | 'in-progress' | 'delivered' | 'failed';

export interface DriverProfile {
  id: string;
  name: string;
  initials: string;
  color: string;
  vehicle: string;
  licensePlate: string;
  phone: string;
}

export interface DeliveryRecord {
  id: string;
  driverId: string;
  orderId: string;
  clientName: string;
  address: string;
  date: string; // ISO string YYYY-MM-DD
  status: DeliveryStatus;
  notes?: string;
}

export const MOCK_DRIVERS: DriverProfile[] = [
  {
    id: 'd1',
    name: 'Carlos Mendoza',
    initials: 'CM',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    vehicle: 'Camioneta Sprinter',
    licensePlate: 'MTY-4521',
    phone: '81 1234 5678',
  },
  {
    id: 'd2',
    name: 'Roberto Garza',
    initials: 'RG',
    color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    vehicle: 'Caja Seca 3.5T',
    licensePlate: 'NL-8834',
    phone: '81 9876 5432',
  },
  {
    id: 'd3',
    name: 'Miguel Ángel Reyes',
    initials: 'MR',
    color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
    vehicle: 'Camioneta Urvan',
    licensePlate: 'MTY-3307',
    phone: '81 5555 0011',
  },
  {
    id: 'd4',
    name: 'Jorge Hernández',
    initials: 'JH',
    color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
    vehicle: 'Pick-up Doble Cabina',
    licensePlate: 'NL-1192',
    phone: '81 3344 7788',
  },
];

export const MOCK_DELIVERIES: DeliveryRecord[] = [
  // Carlos Mendoza — d1
  { id: 'del-001', driverId: 'd1', orderId: '1024', clientName: 'Vidriería Ríos', address: 'Av. Garza Sada 2501, Monterrey', date: '2026-03-20', status: 'delivered' },
  { id: 'del-002', driverId: 'd1', orderId: '1027', clientName: 'Aluminios del Norte', address: 'Blvd. Fundadores 955, San Pedro Garza García', date: '2026-03-20', status: 'delivered' },
  { id: 'del-003', driverId: 'd1', orderId: '1031', clientName: 'Construrama Escobedo', address: 'Av. Aztlán 1100, General Escobedo', date: '2026-03-21', status: 'delivered' },
  { id: 'del-004', driverId: 'd1', orderId: '1033', clientName: 'Ferremax SA', address: 'Av. Universidad 306, Monterrey', date: '2026-03-22', status: 'in-progress' },
  { id: 'del-005', driverId: 'd1', orderId: '1038', clientName: 'Vidrios Premium', address: 'Calle Ocampo 440, Monterrey Centro', date: '2026-03-24', status: 'pending' },
  { id: 'del-006', driverId: 'd1', orderId: '1042', clientName: 'Herrajes Industriales MX', address: 'Av. Lázaro Cárdenas 2321, Guadalupe', date: '2026-03-25', status: 'pending' },

  // Roberto Garza — d2
  { id: 'del-007', driverId: 'd2', orderId: '1015', clientName: 'Distribuidora Apex', address: 'Blvd. Luis Donaldo Colosio 4300, Apodaca', date: '2026-03-18', status: 'delivered' },
  { id: 'del-008', driverId: 'd2', orderId: '1019', clientName: 'Grupo Constructora Regia', address: 'Av. Sendero 800, Santa Catarina', date: '2026-03-19', status: 'delivered' },
  { id: 'del-009', driverId: 'd2', orderId: '1023', clientName: 'Cristalería Martínez', address: 'Calle Venustiano Carranza 250, Monterrey', date: '2026-03-21', status: 'delivered' },
  { id: 'del-010', driverId: 'd2', orderId: '1028', clientName: 'Aceros y Metales del NE', address: 'Av. Miguel Alemán 525, Monterrey', date: '2026-03-23', status: 'delivered' },
  { id: 'del-011', driverId: 'd2', orderId: '1035', clientName: 'Perfiles y Estructuras SA', address: 'Carretera Nacional Km 265, Santiago', date: '2026-03-24', status: 'failed' },
  { id: 'del-012', driverId: 'd2', orderId: '1040', clientName: 'Alumex Monterrey', address: 'Av. Pablo González 1800, Guadalupe', date: '2026-03-25', status: 'pending' },

  // Miguel Ángel Reyes — d3
  { id: 'del-013', driverId: 'd3', orderId: '1017', clientName: 'Ferretería El Clavo', address: 'Calle Morelos 180, Monterrey Centro', date: '2026-03-17', status: 'delivered' },
  { id: 'del-014', driverId: 'd3', orderId: '1021', clientName: 'Cristal y Aluminio JR', address: 'Calle Pino Suárez 45B, San Pedro Garza García', date: '2026-03-19', status: 'delivered' },
  { id: 'del-015', driverId: 'd3', orderId: '1025', clientName: 'Construcciones García', address: 'Av. Benito Juárez 720, General Escobedo', date: '2026-03-22', status: 'in-progress' },
  { id: 'del-016', driverId: 'd3', orderId: '1030', clientName: 'Impermeabilizantes del Norte', address: 'Blvd. Díaz Ordaz 1500, Santa Catarina', date: '2026-03-25', status: 'pending' },

  // Jorge Hernández — d4
  { id: 'del-017', driverId: 'd4', orderId: '1018', clientName: 'Vidrio Arte Monterrey', address: 'Av. de los Leones 2300, Monterrey', date: '2026-03-16', status: 'delivered' },
  { id: 'del-018', driverId: 'd4', orderId: '1026', clientName: 'Inmobiliaria Altamira', address: 'Av. Eugenio Garza Lagüera 3000, San Pedro', date: '2026-03-20', status: 'delivered' },
  { id: 'del-019', driverId: 'd4', orderId: '1034', clientName: 'Herrajes Finos del Norte', address: 'Av. Colón 810, Monterrey', date: '2026-03-23', status: 'delivered' },
  { id: 'del-020', driverId: 'd4', orderId: '1037', clientName: 'Constructora Los Pinos', address: 'Calle Reforma 145, Apodaca', date: '2026-03-25', status: 'pending' },
];
