

import React from 'react';
import {
  Users,
  Calendar,
  DollarSign,
  Settings,
  Plus,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  HeartPulse,
  Pill,
  FileText,
  Printer,
  FileDown,
  Trash2,
  Edit,
  MoreVertical,
  User,
  Search,
  X,
  Wallet,
  Landmark,
  ArrowRight,
  CheckCircle2,
  XCircle,
  FilePlus2,
  BookUser,
  Stethoscope,
  Smile,
  Sheet,
  LayoutDashboard,
  ClipboardCheck,
  FolderArchive,
  Phone,
  Bell,
} from 'lucide-react';

export const ICONS = {
  dashboard: <LayoutDashboard size={20} />,
  patients: <Users size={20} />,
  appointments: <Calendar size={20} />,
  financials: <DollarSign size={20} />,
  settings: <Settings size={20} />,
  add: <Plus size={16} />,
  left: <ChevronLeft size={20} />,
  right: <ChevronRight size={20} />,
  clipboard: <ClipboardList size={20} />,
  medical: <HeartPulse size={20} />,
  prescription: <Pill size={20} />,
  notes: <FileText size={20} />,
  print: <Printer size={16} />,
  csv: <Sheet size={16} />,
  pdf: <FileDown size={16} />,
  delete: <Trash2 size={16} />,
  edit: <Edit size={16} />,
  more: <MoreVertical size={20} />,
  user: <User size={20} />,
  search: <Search size={18} />,
  close: <X size={20} />,
  wallet: <Wallet size={20} />,
  landmark: <Landmark size={20} />,
  arrowRight: <ArrowRight size={20} />,
  check: <CheckCircle2 className="text-green-500" size={18} />,
  cross: <XCircle className="text-red-500" size={18} />,
  addFile: <FilePlus2 size={20} />,
  patientRecord: <BookUser size={20} />,
  doctor: <Stethoscope size={20} />,
  clinic: <Smile size={24} />,
  dentalChart: <Smile size={20} />,
  treatmentPlan: <ClipboardCheck size={20} />,
  documents: <FolderArchive size={20} />,
  phone: <Phone size={16} />,
  reminder: <Bell size={16} />,
  whatsapp: (
    <svg fill="currentColor" viewBox="0 0 24 24" height="1em" width="1em">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.79.46 3.49 1.32 4.95L2 22l5.25-1.38c1.41.79 3.05 1.21 4.79 1.21h.01c5.46 0 9.91-4.45 9.91-9.92 0-5.46-4.45-9.91-9.91-9.91zM17.2 14.25c-.22-.11-.76-.38-1.04-.42-.28-.04-.49-.06-.7.17-.21.23-.79.95-.97 1.14-.18.19-.36.21-.66.07-.3-.13-1.25-.46-2.38-1.47-1.13-.99-1.61-1.74-2.01-2.45-.18-.33-.36-.61-.53-.87-.18-.26-.36-.42-.53-.58-.18-.16-.36-.21-.54-.21-.18 0-.36-.03-.54-.03-.18 0-.47 0-.71.03-.24.03-.63.11-.97.58-.34.47-.95 1.38-.95 2.68 0 1.3.97 3.1 1.11 3.3.14.21 1.92 3.09 4.66 4.14 2.74 1.05 3.89 1.2 4.6.98.71-.22 1.25-.91 1.42-1.75.18-.84.18-1.55.13-1.75-.05-.2-.18-.31-.38-.41z" />
    </svg>
  ),
};

export const ROUTES = {
  DASHBOARD: '/dashboard',
  PATIENTS: '/patients',
  APPOINTMENTS: '/appointments',
  FINANCIALS: '/financials',
  SETTINGS: '/settings',
};

export const PREDEFINED_SHORTCUTS = {
  prescriptions: [
    'Amoxicillin 500mg', 'Ibuprofen 400mg', 'Paracetamol 500mg', 'Metronidazole 400mg'
  ],
  billing: [
    'Consultation Fee', 'X-Ray', 'Scaling & Polishing', 'Tooth Extraction', 'Root Canal Treatment'
  ],
  notes: [
    'RCT initiated on', 'Patient advised for extraction of', 'Caries excavation done on', 'Follow-up after 1 week'
  ],
  doctors: [
    'Dr. Sharma', 'Dr. Gupta'
  ]
};

export const TOOTH_IDs = {
    upperRight: ['18', '17', '16', '15', '14', '13', '12', '11'],
    upperLeft: ['21', '22', '23', '24', '25', '26', '27', '28'],
    lowerLeft: ['38', '37', '36', '35', '34', '33', '32', '31'],
    lowerRight: ['48', '47', '46', '45', '44', '43', '42', '41'],
};

// Universal Numbering System for Primary Teeth
export const PEDO_TOOTH_IDs = {
    upperRight: ['A', 'B', 'C', 'D', 'E'],
    upperLeft: ['F', 'G', 'H', 'I', 'J'],
    lowerLeft: ['O', 'N', 'M', 'L', 'K'],
    lowerRight: ['T', 'S', 'R', 'Q', 'P'],
};

export const DENTAL_CONDITIONS = {
    'Healthy': { name: 'Healthy', color: 'white', hex: '#FFFFFF', description: 'No signs of decay or damage.' },
    'Caries': { name: 'Caries', color: 'red-400', hex: '#F87171', description: 'Presence of tooth decay.' },
    'Filling': { name: 'Filling', color: 'blue-400', hex: '#60A5FA', description: 'Restoration material placed on the tooth.' },
    'Crown': { name: 'Crown', color: 'yellow-400', hex: '#FACC15', description: 'A cap placed over the entire tooth.' },
    'RCT': { name: 'RCT', color: 'purple-400', hex: '#A78BFA', description: 'Root Canal Treatment has been performed.' },
    'Missing': { name: 'Missing', color: 'gray-500', hex: '#6B7280', description: 'Tooth is not present in the arch.' },
    'Implant': { name: 'Implant', color: 'teal-400', hex: '#2DD4BF', description: 'Artificial tooth root is in place.' },
    'Other': { name: 'Other', color: 'orange-400', hex: '#FB923C', description: 'Other conditions noted (see notes).' },
};