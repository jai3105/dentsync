import React, { createContext, useReducer, useContext, useEffect, ReactNode } from 'react';
import { AppState, AppAction, ActionType, Patient, FinancialTransaction, TransactionType, BillingStatus, WhatsAppTemplates, User } from '../types';
import { auth } from '../services/firebase';

const APP_STORAGE_KEY = 'dentSyncData';

const DEFAULT_WHATSAPP_TEMPLATES: WhatsAppTemplates = {
  patientReport: `Hello {{patient_name}},

This is from {{clinic_name}}.

Your dental report from your visit on {{visit_date}} with Dr. {{doctor_name}} is now ready.

{{report_summary}}

If you have any questions, feel free to reply to this message.

Thank you for choosing {{clinic_name}}!
Contact us: {{clinic_contact}}
Address: {{clinic_address}}

– Team {{clinic_name}}`,
  appointmentConfirmation: `Hello {{patient_name}},

This is a confirmation for your appointment at *{{clinic_name}}*.

*Details:*
- *Procedure:* {{procedure}}
- *Doctor:* {{doctor_name}}
- *Date:* {{appointment_date}}
- *Time:* {{appointment_time}}

Please arrive 10 minutes early. If you need to reschedule, please contact us at {{clinic_contact}}.
Our Address: {{clinic_address}}

Thank you,
Team {{clinic_name}}`,
  appointmentReminder: `Hello {{patient_name}},

This is a friendly reminder for your upcoming appointment at *{{clinic_name}}*.

*Details:*
- *Procedure:* {{procedure}}
- *Doctor:* {{doctor_name}}
- *Date:* {{appointment_date}}
- *Time:* {{appointment_time}}

We look forward to seeing you. If you have any questions or need to reschedule, please contact us at {{clinic_contact}}.
Our Address: {{clinic_address}}

Thank you,
Team {{clinic_name}}`,
};


const getInitialState = (): AppState => {
  let initialState: AppState = {
    isAuthenticated: false,
    isAuthLoading: true,
    user: null,
    clinicName: 'DentSync Clinic',
    clinicContactNumber: '',
    clinicLogo: '',
    clinicAddress: '',
    patients: [],
    appointments: [],
    transactions: [],
    shortcuts: [],
    whatsappTemplates: DEFAULT_WHATSAPP_TEMPLATES,
  };

  try {
    const storedData = localStorage.getItem(APP_STORAGE_KEY);
    if (storedData) {
      const parsedData = JSON.parse(storedData);
      // Ensure new data structures are present
      const patients = (parsedData.patients || []).map((p: Patient) => ({
        ...p,
        medicalHistory: p.medicalHistory || { allergies: '', conditions: '' },
        dentalChart: p.dentalChart || {},
        treatmentPlan: p.treatmentPlan || [],
        caseNotes: p.caseNotes || [],
        generalNotes: p.generalNotes || [],
        prescriptions: p.prescriptions || [],
        documents: p.documents || [],
      }));
      
      initialState = {
        ...initialState,
        clinicName: parsedData.clinicName || 'DentSync Clinic',
        clinicContactNumber: parsedData.clinicContactNumber || '',
        clinicLogo: parsedData.clinicLogo || '',
        clinicAddress: parsedData.clinicAddress || '',
        patients,
        appointments: parsedData.appointments || [],
        transactions: parsedData.transactions || [],
        shortcuts: parsedData.shortcuts || [],
        whatsappTemplates: {
            ...DEFAULT_WHATSAPP_TEMPLATES,
            ...(parsedData.whatsappTemplates || {}),
        }
      };
    }
  } catch (error) {
    console.error("Failed to parse from localStorage", error);
  }
  
  return initialState;
};

const initialState = getInitialState();

const AppContext = createContext<{ state: AppState; dispatch: React.Dispatch<AppAction> }>({
  state: initialState,
  dispatch: () => null,
});

const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case ActionType.SET_USER:
      return { ...state, isAuthenticated: true, user: action.payload, isAuthLoading: false };
    case ActionType.LOGOUT:
      return { ...state, isAuthenticated: false, user: null, isAuthLoading: false };
    case ActionType.UPDATE_SETTINGS:
      return { ...state, ...action.payload };
    case ActionType.ADD_PATIENT:
      return { ...state, patients: [...state.patients, action.payload] };
    case ActionType.UPDATE_PATIENT:
      return {
        ...state,
        patients: state.patients.map((p) => (p.id === action.payload.id ? action.payload : p)),
      };
    case ActionType.ADD_APPOINTMENT:
      return { ...state, appointments: [...state.appointments, action.payload] };
    case ActionType.UPDATE_APPOINTMENT:
        return {
            ...state,
            appointments: state.appointments.map(a => a.id === action.payload.id ? action.payload : a)
        };
    case ActionType.DELETE_APPOINTMENT:
        return {
            ...state,
            appointments: state.appointments.filter(a => a.id !== action.payload.id)
        };
    case ActionType.ADD_TRANSACTION:
        return {...state, transactions: [...state.transactions, action.payload]};
    case ActionType.UPDATE_TRANSACTION:
        return {
            ...state,
            transactions: state.transactions.map(t => t.id === action.payload.id ? action.payload : t)
        };
    case ActionType.DELETE_TRANSACTION:
        return {
            ...state,
            transactions: state.transactions.filter(t => t.id !== action.payload.id)
        };
    case ActionType.ADD_SHORTCUT:
        return {...state, shortcuts: [...state.shortcuts, action.payload]};
    case ActionType.DELETE_SHORTCUT:
        return {...state, shortcuts: state.shortcuts.filter(s => s.id !== action.payload.id)};
    case ActionType.ADD_PRESCRIPTION:
        return {
            ...state,
            patients: state.patients.map(p => p.id === action.payload.patientId ? { ...p, prescriptions: [...(p.prescriptions || []), action.payload.prescription] } : p)
        }
    case ActionType.UPDATE_PRESCRIPTION:
        return {
            ...state,
            patients: state.patients.map(p => {
                if (p.id === action.payload.patientId) {
                    return {
                        ...p,
                        prescriptions: p.prescriptions.map(pr => pr.id === action.payload.prescription.id ? action.payload.prescription : pr)
                    }
                }
                return p;
            })
        }
    case ActionType.DELETE_PRESCRIPTION:
        return {
            ...state,
            patients: state.patients.map(p => {
                if (p.id === action.payload.patientId) {
                    return {
                        ...p,
                        prescriptions: p.prescriptions.filter(pr => pr.id !== action.payload.prescriptionId)
                    }
                }
                return p;
            })
        }
    case ActionType.ADD_BILLING:
        return {
            ...state,
            patients: state.patients.map(p => {
                if (p.id === action.payload.patientId) {
                    const updatedPatient = { 
                        ...p, 
                        billing: [...p.billing, action.payload.billing] 
                    };

                    // If a treatment plan item is linked, mark it as billed
                    if (action.payload.treatmentPlanItemId) {
                        updatedPatient.treatmentPlan = updatedPatient.treatmentPlan.map(item =>
                            item.id === action.payload.treatmentPlanItemId
                                ? { ...item, isBilled: true }
                                : item
                        );
                    }
                    return updatedPatient;
                }
                return p;
            })
        }
    case ActionType.UPDATE_BILLING: {
      let newTransaction: FinancialTransaction | null = null;
      
      const updatedPatients = state.patients.map(p => {
          if (p.id === action.payload.patientId) {
              const billingItem = p.billing.find(b => b.id === action.payload.billingId);
              
              if (billingItem && action.payload.status === BillingStatus.Paid && billingItem.status !== BillingStatus.Paid) {
                   newTransaction = {
                      id: Date.now().toString(),
                      date: new Date().toISOString().split('T')[0],
                      type: TransactionType.Income,
                      category: 'Patient Payment',
                      description: `Payment from ${p.firstName} ${p.lastName} for "${billingItem.description}"`,
                      amount: billingItem.amount,
                  };
              }

              return {
                  ...p,
                  billing: p.billing.map(b => b.id === action.payload.billingId ? {...b, status: action.payload.status} : b)
              }
          }
          return p;
      });

      return {
          ...state,
          patients: updatedPatients,
          transactions: newTransaction ? [...state.transactions, newTransaction] : state.transactions
      };
    }
    case ActionType.UPDATE_BILLING_ITEM:
        return {
            ...state,
            patients: state.patients.map(p => {
                if (p.id === action.payload.patientId) {
                    return {
                        ...p,
                        billing: p.billing.map(b => b.id === action.payload.billingItem.id ? action.payload.billingItem : b)
                    }
                }
                return p;
            })
        }
    case ActionType.ADD_CASE_NOTE:
        return {
            ...state,
            patients: state.patients.map(p => p.id === action.payload.patientId ? { ...p, caseNotes: [...(p.caseNotes || []), action.payload.caseNote] } : p)
        }
    case ActionType.ADD_GENERAL_NOTE:
        return {
            ...state,
            patients: state.patients.map(p => p.id === action.payload.patientId ? { ...p, generalNotes: [...(p.generalNotes || []), action.payload.note] } : p)
        }
    case ActionType.UPDATE_DENTAL_CHART:
        return {
          ...state,
          patients: state.patients.map(p => p.id === action.payload.patientId ? { ...p, dentalChart: action.payload.chartData } : p)
        }
    case ActionType.ADD_TREATMENT_PLAN_ITEM:
        return {
          ...state,
          patients: state.patients.map(p => p.id === action.payload.patientId ? { ...p, treatmentPlan: [...(p.treatmentPlan || []), action.payload.item] } : p)
        }
    case ActionType.UPDATE_TREATMENT_PLAN_ITEM:
        return {
          ...state,
          patients: state.patients.map(p => p.id === action.payload.patientId ? { ...p, treatmentPlan: p.treatmentPlan.map(item => item.id === action.payload.item.id ? action.payload.item : item) } : p)
        }
    case ActionType.DELETE_TREATMENT_PLAN_ITEM:
        return {
          ...state,
          patients: state.patients.map(p => p.id === action.payload.patientId ? { ...p, treatmentPlan: p.treatmentPlan.filter(item => item.id !== action.payload.itemId) } : p)
        }
    case ActionType.ADD_DOCUMENT:
      return {
          ...state,
          patients: state.patients.map(p =>
              p.id === action.payload.patientId
                  ? { ...p, documents: [...(p.documents || []), action.payload.document] }
                  : p
          )
      };
    case ActionType.DELETE_DOCUMENT: {
      const { patientId, documentId } = action.payload;
      const patientIndex = state.patients.findIndex(p => p.id === patientId);

      if (patientIndex === -1) {
        return state;
      }

      const patientToUpdate = state.patients[patientIndex];
      const updatedDocuments = (patientToUpdate.documents || []).filter(
        doc => doc.id !== documentId
      );
      
      if (updatedDocuments.length === (patientToUpdate.documents || []).length) {
          return state;
      }

      const updatedPatient = {
        ...patientToUpdate,
        documents: updatedDocuments,
      };

      const updatedPatients = [
        ...state.patients.slice(0, patientIndex),
        updatedPatient,
        ...state.patients.slice(patientIndex + 1),
      ];

      return {
        ...state,
        patients: updatedPatients,
      };
    }
    default:
      return state;
  }
};

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        dispatch({ type: ActionType.SET_USER, payload: user });
      } else {
        dispatch({ type: ActionType.LOGOUT });
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    try {
      // Don't store auth state in localStorage
      const { isAuthenticated, isAuthLoading, user, ...restOfState } = state;
      localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(restOfState));
    } catch (error) {
      console.error("Failed to save to localStorage", error);
    }
  }, [state]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);