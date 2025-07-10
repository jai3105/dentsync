import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../contexts/AppContext';
import { ICONS, ROUTES } from '../constants';
import { Patient, BillingStatus } from '../types';
import { exportPatientToPDF, exportPatientToWhatsAppMessage } from '../services/exportService';
import Modal from '../components/Modal';
import PatientForm from '../components/AddPatientForm';
import OverviewTab from '../components/patient-detail/OverviewTab';
import PrescriptionsTab from '../components/patient-detail/PrescriptionsTab';
import BillingTab from '../components/patient-detail/BillingTab';
import CaseNotesTab from '../components/patient-detail/CaseNotesTab';
import DentalChartTab from '../components/patient-detail/DentalChartTab';
import TreatmentPlanTab from '../components/patient-detail/TreatmentPlanTab';
import DocumentsTab from '../components/patient-detail/DocumentsTab';
import AppointmentsTab from '../components/patient-detail/AppointmentsTab';
import { format } from 'date-fns';

const PrintReportModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  patient: Patient;
  clinicName: string;
  clinicLogo: string;
  clinicAddress: string;
}> = ({ isOpen, onClose, patient, clinicName, clinicLogo, clinicAddress }) => {
  const [sections, setSections] = useState({
    dentalChart: true,
    treatmentPlan: true,
    prescriptions: true,
    caseNotes: true,
    billing: true,
    documents: true,
  });

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setSections(prev => ({ ...prev, [name]: checked }));
  };

  const handlePrint = () => {
    exportPatientToPDF(patient, clinicName, clinicLogo, clinicAddress, sections);
  };
  
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Print Patient Report" size="md">
      <div className="space-y-4">
        <p className="text-slate-600">Select the sections you want to include in the PDF report.</p>
        <div className="grid grid-cols-2 gap-3">
          {Object.keys(sections).map((key) => (
            <label key={key} className="flex items-center space-x-2 bg-slate-50 p-2 rounded-md">
              <input
                type="checkbox"
                name={key}
                checked={sections[key as keyof typeof sections]}
                onChange={handleCheckboxChange}
                className="h-4 w-4 rounded border-gray-300 text-primary-700 focus:ring-primary-700"
              />
              <span className="text-sm font-medium text-slate-700 capitalize">
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </span>
            </label>
          ))}
        </div>
        <div className="flex justify-end gap-3 pt-4">
          <button type="button" onClick={onClose} className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50">Cancel</button>
          <button onClick={handlePrint} className="flex items-center gap-2 rounded-md bg-primary-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-800">
            {ICONS.print} Generate PDF
          </button>
        </div>
      </div>
    </Modal>
  );
};

const WhatsAppReportModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  patient: Patient;
  clinicName: string;
  clinicContactNumber: string;
  clinicAddress: string;
}> = ({ isOpen, onClose, patient, clinicName, clinicContactNumber, clinicAddress }) => {
  const { state } = useAppContext();
  const [sections, setSections] = useState({
    dentalChart: true,
    treatmentPlan: true,
    prescriptions: true,
    caseNotes: true,
    billing: true,
  });

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setSections(prev => ({ ...prev, [name]: checked }));
  };

  const handleSend = () => {
    const latestAppointment = state.appointments
        .filter(a => a.patientId === patient.id)
        .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

    const doctorName = latestAppointment?.doctor || "your Doctor";
    const visitDate = latestAppointment ? format(new Date(latestAppointment.date), 'PP') : format(new Date(), 'PP');

    const message = exportPatientToWhatsAppMessage(
        patient, 
        clinicName, 
        clinicContactNumber,
        clinicAddress,
        sections,
        { doctorName, visitDate },
        state.whatsappTemplates.patientReport
    );
    // Basic phone number cleaning - remove non-digits. Assumes user includes country code.
    const phoneNumber = patient.phone.replace(/\D/g, '');
    if (!phoneNumber) {
        alert("Patient phone number is not valid.");
        return;
    }
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
    onClose();
  };
  
  if (!isOpen) return null;

  const sectionKeys = Object.keys(sections);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Send Report via WhatsApp" size="md">
      <div className="space-y-4">
        <p className="text-slate-600">Select sections to include in the message. The message will be pre-filled in WhatsApp for you to send.</p>
        <div className="grid grid-cols-2 gap-3">
          {sectionKeys.map((key) => (
            <label key={key} className="flex items-center space-x-2 bg-slate-50 p-2 rounded-md">
              <input
                type="checkbox"
                name={key}
                checked={sections[key as keyof typeof sections]}
                onChange={handleCheckboxChange}
                className="h-4 w-4 rounded border-gray-300 text-primary-700 focus:ring-primary-700"
              />
              <span className="text-sm font-medium text-slate-700 capitalize">
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </span>
            </label>
          ))}
        </div>
        <div className="flex justify-end gap-3 pt-4">
          <button type="button" onClick={onClose} className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50">Cancel</button>
          <button onClick={handleSend} className="flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700">
            <span className="text-white">{ICONS.whatsapp}</span> Generate & Send
          </button>
        </div>
      </div>
    </Modal>
  );
};


const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
    <div className={`bg-white rounded-lg shadow-sm ${className}`}>{children}</div>
);
const CardHeader: React.FC<{ children: React.ReactNode; }> = ({ children }) => (
    <div className="p-4 border-b border-slate-200">{children}</div>
);
const CardContent: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
    <div className={`p-4 ${className}`}>{children}</div>
);

const PatientList: React.FC<{ onSelectPatient: (id: string) => void; searchQuery: string }> = ({ onSelectPatient, searchQuery }) => {
    const { state } = useAppContext();
    const filteredPatients = useMemo(() => 
        state.patients.filter(p => 
            `${p.firstName} ${p.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.phone.includes(searchQuery)
        ), [state.patients, searchQuery]);

    return (
        <Card className="flex-1">
            <CardContent>
                {filteredPatients.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-slate-500">
                            <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                                <tr>
                                    <th className="px-6 py-3">Name</th>
                                    <th className="px-6 py-3">Phone</th>
                                    <th className="px-6 py-3">DOB</th>
                                    <th className="px-6 py-3">Outstanding</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredPatients.map(p => {
                                    const outstanding = p.billing.filter(b => b.status === BillingStatus.Pending).reduce((acc, item) => acc + item.amount, 0);
                                    return (
                                    <tr key={p.id} onClick={() => onSelectPatient(p.id)} className="bg-white border-b hover:bg-slate-50 cursor-pointer">
                                        <td className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap">{`${p.firstName} ${p.lastName}`}</td>
                                        <td className="px-6 py-4">{p.phone}</td>
                                        <td className="px-6 py-4">{p.dateOfBirth}</td>
                                        <td className={`px-6 py-4 font-semibold ${outstanding > 0 ? 'text-amber-600' : 'text-slate-500'}`}>{`₹${outstanding.toFixed(2)}`}</td>
                                    </tr>
                                )})}
                            </tbody>
                        </table>
                    </div>
                ) : <p className="text-center text-slate-500 py-8">No patients found. Use the "Add New Patient" button to get started.</p>}
            </CardContent>
        </Card>
    );
};

const PatientDetail: React.FC<{ patient: Patient; onBack: () => void; onPrint: () => void; onWhatsApp: () => void; }> = ({ patient, onBack, onPrint, onWhatsApp }) => {
    const { tab } = useParams();
    const navigate = useNavigate();
    const activeTab = tab || 'overview';
    
    const outstandingBalance = useMemo(() => 
        patient.billing.filter(b => b.status === BillingStatus.Pending).reduce((acc, item) => acc + item.amount, 0),
        [patient.billing]
    );
    
    const TABS = [
        { id: 'overview', label: 'Overview', icon: ICONS.user },
        { id: 'dentalChart', label: 'Dental Chart', icon: ICONS.dentalChart },
        { id: 'treatmentPlan', label: 'Treatment Plan', icon: ICONS.treatmentPlan },
        { id: 'appointments', label: 'Appointments', icon: ICONS.appointments },
        { id: 'prescriptions', label: 'Prescriptions', icon: ICONS.prescription },
        { id: 'billing', label: 'Billing', icon: ICONS.financials },
        { id: 'notes', label: 'Notes', icon: ICONS.notes },
        { id: 'documents', label: 'Documents', icon: ICONS.documents },
    ];

    const TabContent = () => {
        switch(activeTab) {
            case 'overview': return <OverviewTab patient={patient} />;
            case 'dentalChart': return <DentalChartTab patient={patient} />;
            case 'treatmentPlan': return <TreatmentPlanTab patient={patient} />;
            case 'appointments': return <AppointmentsTab patient={patient} />;
            case 'prescriptions': return <PrescriptionsTab patient={patient} />;
            case 'billing': return <BillingTab patient={patient} />;
            case 'notes': return <CaseNotesTab patient={patient} />;
            case 'documents': return <DocumentsTab patient={patient} />;
            default: return <OverviewTab patient={patient} />;
        }
    };
    
    return (
        <Card className="flex-1 flex flex-col">
            <CardHeader>
                <div className="flex flex-wrap justify-between items-center gap-4">
                    <div>
                        <button onClick={onBack} className="text-sm text-primary-700 hover:underline mb-2 flex items-center gap-1">{ICONS.left} Back to list</button>
                        <h2 className="text-xl font-bold text-slate-800">{`${patient.firstName} ${patient.lastName}`}</h2>
                        <p className="text-sm text-slate-500">{patient.email || 'No email'} &bull; {patient.phone}</p>
                    </div>
                    <div className="flex items-center gap-3">
                       <div className="text-right">
                         <span className="text-sm text-secondary-700">Outstanding</span>
                         <p className="text-lg font-semibold text-secondary-600">
                             ₹{outstandingBalance.toFixed(2)}
                         </p>
                       </div>
                       <button onClick={onWhatsApp} className="flex items-center gap-2 rounded-md bg-green-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-green-600">
                           <span className="text-white">{ICONS.whatsapp}</span> WhatsApp
                       </button>
                       <button onClick={onPrint} className="flex items-center gap-2 rounded-md bg-secondary-500 px-4 py-2 text-sm font-semibold text-dark-text shadow-sm transition hover:bg-secondary-600">
                           {ICONS.print} Print Report
                       </button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
                <div className="border-b border-slate-200">
                    <nav className="-mb-px flex space-x-6 overflow-x-auto">
                        {TABS.map(t => (
                            <button key={t.id} onClick={() => navigate(`${ROUTES.PATIENTS}/${patient.id}/${t.id}`)} className={`flex items-center gap-2 py-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === t.id ? 'border-primary-700 text-primary-700' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}>
                                {t.icon} {t.label}
                            </button>
                        ))}
                    </nav>
                </div>
                 <div className="mt-6 flex-1 overflow-y-auto custom-scrollbar">
                     <TabContent />
                 </div>
            </CardContent>
        </Card>
    );
}

const PatientsPage: React.FC = () => {
    const { patientId } = useParams();
    const navigate = useNavigate();
    const { state } = useAppContext();
    const [searchQuery, setSearchQuery] = useState('');
    const [isAddPatientModalOpen, setIsAddPatientModalOpen] = useState(false);
    const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
    const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);

    const selectedPatient = useMemo(() => 
        patientId ? state.patients.find(p => p.id === patientId) : null, 
    [patientId, state.patients]);

    const handleSelectPatient = (id: string) => {
        navigate(`${ROUTES.PATIENTS}/${id}/overview`);
    };
    
    const handleBackToList = () => {
        navigate(ROUTES.PATIENTS);
    };

    const handleAddNewPatient = () => {
        setIsAddPatientModalOpen(true);
    }
    
    const handlePatientAdded = (newPatient: Patient) => {
        setIsAddPatientModalOpen(false);
        navigate(`${ROUTES.PATIENTS}/${newPatient.id}/overview`);
    }

    return (
        <div className="space-y-6 h-full flex flex-col">
            <div className="flex justify-between items-center">
                 <h1 className="text-3xl font-bold text-slate-800">{selectedPatient ? `${selectedPatient.firstName} ${selectedPatient.lastName}` : "Patients"}</h1>
                {!selectedPatient && (
                     <button onClick={handleAddNewPatient} className="flex items-center gap-2 rounded-md bg-primary-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-800">
                        {ICONS.add} Add New Patient
                    </button>
                )}
            </div>

            {!selectedPatient ? (
                <div className="flex flex-col gap-4 flex-1">
                    <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            {ICONS.search}
                        </div>
                        <input
                            type="text"
                            placeholder="Search by name or phone..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="block w-full rounded-lg border border-slate-300 bg-white p-2.5 pl-10 text-slate-900 focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        />
                    </div>
                    <PatientList onSelectPatient={handleSelectPatient} searchQuery={searchQuery} />
                </div>
            ) : (
                <div className="flex-1 min-h-0">
                    <PatientDetail patient={selectedPatient} onBack={handleBackToList} onPrint={() => setIsPrintModalOpen(true)} onWhatsApp={() => setIsWhatsAppModalOpen(true)} />
                </div>
            )}
            
            <Modal isOpen={isAddPatientModalOpen} onClose={() => setIsAddPatientModalOpen(false)} title="Add New Patient">
                <PatientForm
                    onSuccess={handlePatientAdded} 
                    onClose={() => setIsAddPatientModalOpen(false)} 
                />
            </Modal>
            
            {selectedPatient && (
              <PrintReportModal
                isOpen={isPrintModalOpen}
                onClose={() => setIsPrintModalOpen(false)}
                patient={selectedPatient}
                clinicName={state.clinicName}
                clinicLogo={state.clinicLogo}
                clinicAddress={state.clinicAddress}
              />
            )}
            {selectedPatient && (
              <WhatsAppReportModal
                isOpen={isWhatsAppModalOpen}
                onClose={() => setIsWhatsAppModalOpen(false)}
                patient={selectedPatient}
                clinicName={state.clinicName}
                clinicContactNumber={state.clinicContactNumber}
                clinicAddress={state.clinicAddress}
              />
            )}
        </div>
    );
};

export default PatientsPage;