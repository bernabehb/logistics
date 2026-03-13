import { redirect } from 'next/navigation';

export default function Home() {
  // Redirigir al usuario automáticamente a la página de logística
  redirect('/logistics');
}
