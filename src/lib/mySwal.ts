import Swal from 'sweetalert2';
import type { SweetAlertIcon, SweetAlertOptions } from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

export const MySwal = withReactContent(Swal);

type SwalTheme = Pick<SweetAlertOptions, 'background' | 'color' | 'customClass'>;

const isDarkMode = () =>
  typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

export const getSwalTheme = (): SwalTheme => {
  const dark = isDarkMode();

  return {
    background: dark ? '#0f172a' : '#ffffff',
    color: dark ? '#e5e7eb' : '#334155',
    customClass: {
      popup: dark
        ? 'border border-slate-700 shadow-2xl rounded-2xl'
        : 'border border-slate-200 shadow-2xl rounded-2xl',
      title: dark ? 'text-slate-100' : 'text-slate-700',
      htmlContainer: dark ? 'text-slate-300' : 'text-slate-600'
    }
  };
};

type ConfirmOptions = {
  title: string;
  html?: string;
  text?: string;
  icon?: SweetAlertIcon;
  iconColor?: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
  confirmButtonColor?: string;
  cancelButtonColor?: string;
  focusCancel?: boolean;
};

type MessageOptions = {
  title: string;
  html?: string;
  text?: string;
  timer?: number;
  confirmButtonText?: string;
};

type LoadingOptions = {
  title?: string;
  html?: string;
  text?: string;
  width?: number;
};

export const showConfirm = async ({
  title,
  html,
  text,
  icon = 'question',
  iconColor = '#60a5fa',
  confirmButtonText = 'Aceptar',
  cancelButtonText = 'Cancelar',
  confirmButtonColor = '#2563eb',
  cancelButtonColor = '#dc2626',
  focusCancel = true
}: ConfirmOptions) => {
  const result = await MySwal.fire({
    ...getSwalTheme(),
    icon,
    iconColor,
    title,
    html,
    text,
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText,
    confirmButtonColor,
    cancelButtonColor,
    reverseButtons: true,
    focusCancel
  });

  return result.isConfirmed;
};

export const showLoading = ({
  title = 'Procesando...',
  html,
  text,
  width = 420
}: LoadingOptions = {}) => {
  return MySwal.fire({
    ...getSwalTheme(),
    title,
    html,
    text,
    width,
    allowOutsideClick: false,
    allowEscapeKey: false,
    showConfirmButton: false,
    didOpen: () => {
      MySwal.showLoading();
    }
  });
};

export const showSuccess = ({
  title,
  html,
  text,
  timer = 1600,
  confirmButtonText = 'Aceptar'
}: MessageOptions) => {
  return MySwal.fire({
    ...getSwalTheme(),
    icon: 'success',
    title,
    html,
    text,
    timer,
    showConfirmButton: timer <= 0,
    confirmButtonText,
    confirmButtonColor: '#16a34a'
  });
};

export const showError = ({
  title,
  html,
  text,
  confirmButtonText = 'Entendido'
}: MessageOptions) => {
  return MySwal.fire({
    ...getSwalTheme(),
    icon: 'error',
    title,
    html,
    text,
    confirmButtonText,
    confirmButtonColor: '#dc2626'
  });
};

export const closeSwal = () => MySwal.close();
