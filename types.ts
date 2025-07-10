import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';

export type User = firebase.User;

export interface DentalChartData {
  [toothId: string]: {
    condition: 'Healthy' | 'Caries' | 'Filling' | 'Crown' | 'RCT' | 'Missing' | 'Implant' | 'Other';
    notes: string;
  };
}

export interface Document {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string; // data URL
  uploadedAt: string;
}

export interface TreatmentPlanItem {
  id: string;
  procedure: string;
  tooth: string; // e.g., '11', '24'
  status: 'Planned' | 'In Progress' | 'Completed' | 'On Hold';
  cost: number;
  date: string;
  isBilled?: boolean;
}

export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'Male' | 'Female' | 'Other';
  phone: string;
  email: string;
  address: string;
  medicalHistory: {
    allergies: string;
    conditions: string;
  };
  dentalChart: DentalChartData;
  treatmentPlan: TreatmentPlanItem[];
  caseNotes: CaseNote[];
  generalNotes: CaseNote[];
  prescriptions: Prescription[];
  billing: BillingEntry[];
  documents: Document[];
}

export interface CaseNote {
  id: string;
  date: string;
  note: string;
}

export enum PrescriptionStatus {
  Active = 'Active',
  Completed = 'Completed',
  Discontinued = 'Discontinued',
}

export interface Prescription {
  id: string;
  medication: string;
  dosage: string;
  frequency: string;
  drugType: string;
  duration: string;
  route: string;
  instructions: string;
  advice: string;
  doctor: string;
  status: PrescriptionStatus;
  startDate: string;
  endDate: string;
}

export enum BillingStatus {
  Pending = 'Pending',
  Paid = 'Paid'
}

export interface BillingEntry {
  id: string;
  date: string;
  description: string;
  amount: number;
  status: BillingStatus;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  doctor: string;
  procedure: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
}

export enum TransactionType {
  Income = 'Income',
  Expense = 'Expense'
}

export interface FinancialTransaction {
  id: string;
  date: string;
  type: TransactionType;
  category: string;
  description: string;
  amount: number;
}

export type Shortcut = {
  id: string;
  category: 'notes';
  value: string;
} | {
  id: string;
  category: 'doctors';
  value: string;
} | {
  id: string;
  category: 'billing';
  value: { description: string; amount: number };
} | {
  id:string;
  category: 'prescriptions';
  value: Partial<Omit<Prescription, 'id' | 'startDate' | 'endDate'>>;
}

export interface WhatsAppTemplates {
  patientReport: string;
  appointmentConfirmation: string;
  appointmentReminder: string;
}

export interface AppState {
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  user: User | null;
  clinicName: string;
  clinicContactNumber: string;
  clinicLogo: string;
  clinicAddress: string;
  patients: Patient[];
  appointments: Appointment[];
  transactions: FinancialTransaction[];
  shortcuts: Shortcut[];
  whatsappTemplates: WhatsAppTemplates;
}

export enum ActionType {
  SET_USER,
  LOGOUT,
  UPDATE_SETTINGS,
  ADD_PATIENT,
  UPDATE_PATIENT,
  ADD_APPOINTMENT,
  UPDATE_APPOINTPOINTMENT,
  DELETE_APPOINTMENT,
  ADD_TRANSACTION,
  UPDATE_TRANSACTION,
  DELETE_TRANSACTION,
  ADD_SHORTCUT,
  DELETE_SHORTCUT,
  ADD_PRESCRIPTION,
  UPDATE_PRESCRIPTION,
  DELETE_PRESCRIPTION,
  ADD_BILLING,
  UPDATE_BILLING,
  ADD_CASE_NOTE,
  ADD_GENERAL_NOTE,
  UPDATE_DENTAL_CHART,
  ADD_TREATMENT_PLAN_ITEM,
  UPDATE_TREATMENT_PLAN_ITEM,
  DELETE_TREATMENT_PLAN_ITEM,
  ADD_DOCUMENT,
  DELETE_DOCUMENT,
  UPDATE_BILLING_ITEM,
}

export type AppAction =
  | { type: ActionType.SET_USER; payload: User }
  | { type: ActionType.LOGOUT }
  | { type: ActionType.UPDATE_SETTINGS, payload: Partial<Pick<AppState, 'clinicName' | 'clinicContactNumber' | 'clinicLogo' | 'clinicAddress' | 'whatsappTemplates'>> }
  | { type: ActionType.ADD_PATIENT; payload: Patient }
  | { type: ActionType.UPDATE_PATIENT; payload: Patient }
  | { type: ActionType.ADD_APPOINTMENT; payload: Appointment }
  | { type: ActionType.UPDATE_APPOINTMENT; payload: Appointment }
  | { type: ActionType.DELETE_APPOINTMENT; payload: { id: string } }
  | { type: ActionType.ADD_TRANSACTION; payload: FinancialTransaction }
  | { type: ActionType.UPDATE_TRANSACTION; payload: FinancialTransaction }
  | { type: ActionType.DELETE_TRANSACTION; payload: { id: string } }
  | { type: ActionType.ADD_SHORTCUT; payload: Shortcut }
  | { type: ActionType.DELETE_SHORTCUT; payload: { id: string } }
  | { type: ActionType.ADD_PRESCRIPTION; payload: { patientId: string; prescription: Prescription } }
  | { type: ActionType.UPDATE_PRESCRIPTION; payload: { patientId: string; prescription: Prescription } }
  | { type: ActionType.DELETE_PRESCRIPTION; payload: { patientId: string; prescriptionId: string } }
  | { type: ActionType.ADD_BILLING; payload: { patientId: string; billing: BillingEntry; treatmentPlanItemId?: string } }
  | { type: ActionType.UPDATE_BILLING; payload: { patientId: string; billingId: string; status: BillingStatus } }
  | { type: ActionType.UPDATE_BILLING_ITEM; payload: { patientId: string; billingItem: BillingEntry } }
  | { type: ActionType.ADD_CASE_NOTE; payload: { patientId: string; caseNote: CaseNote } }
  | { type: ActionType.ADD_GENERAL_NOTE; payload: { patientId: string; note: CaseNote } }
  | { type: ActionType.UPDATE_DENTAL_CHART; payload: { patientId: string; chartData: DentalChartData } }
  | { type: ActionType.ADD_TREATMENT_PLAN_ITEM; payload: { patientId: string; item: TreatmentPlanItem } }
  | { type: ActionType.UPDATE_TREATMENT_PLAN_ITEM; payload: { patientId: string; item: TreatmentPlanItem } }
  | { type: ActionType.DELETE_TREATMENT_PLAN_ITEM; payload: { patientId: string; itemId: string } }
  | { type: ActionType.ADD_DOCUMENT; payload: { patientId: string; document: Document } }
  | { type: ActionType.DELETE_DOCUMENT; payload: { patientId: string; documentId: string } };