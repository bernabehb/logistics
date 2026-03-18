import { redirect } from 'next/navigation';

export default function Home() {
  // Redirigir al usuario automáticamente al login (el middleware maneja roles)
  redirect('/login');
}
