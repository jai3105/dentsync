import React, { useState } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { PREDEFINED_SHORTCUTS, ICONS } from '../constants';
import { Shortcut, ActionType, Prescription, WhatsAppTemplates } from '../types';
import { X } from 'lucide-react';

type ShortcutCategory = 'notes' | 'prescriptions' | 'billing' | 'doctors';

const TemplateEditor: React.FC<{
  title: string;
  template: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholders: { name: string; description: string }[];
}> = ({ title, template, onChange, placeholders }) => {
  return (
    <div>
      <h4 className="text-md font-semibold text-slate-700 mb-2">{title}</h4>
      <textarea
        value={template}
        onChange={onChange}
        rows={10}
        className="block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm font-mono text-xs"
      />
      <div className="mt-2 p-3 bg-slate-50 rounded-md border border-slate-200">
        <p className="text-xs font-semibold text-slate-600 mb-2">Available Placeholders:</p>
        <ul className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
          {placeholders.map(p => (
            <li key={p.name}>
              <code className="text-primary-700 bg-primary-100 p-0.5 rounded">{`{{${p.name}}}`}</code>
              <span className="text-slate-500 ml-1">- {p.description}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

const ShortcutManager: React.FC<{
  title: string;
  category: ShortcutCategory;
  predefined: readonly any[];
  custom: Shortcut[];
  onAdd: (value: any) => void;
  onDelete: (id: string) => void;
  form: React.ReactNode;
  renderValue: (value: any) => React.ReactNode;
}> = ({ title, predefined, custom, onAdd, onDelete, form, renderValue }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h3 className="text-lg font-semibold text-slate-800 mb-4">{title}</h3>
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-slate-500">Predefined Shortcuts</h4>
        <div className="flex flex-wrap gap-2">
          {predefined.map((item, index) => (
            <span key={index} className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm">
              {typeof item === 'object' ? item.description || item.medication || item : item}
            </span>
          ))}
        </div>
        
        <hr className="my-4"/>

        <h4 className="text-sm font-medium text-slate-500">Your Custom Shortcuts</h4>
         <div className="flex flex-wrap gap-2">
            {custom.map(item => (
                <div key={item.id} className="flex items-center gap-1 pl-3 pr-1 py-1 bg-primary-100 text-primary-800 rounded-full text-sm">
                    {renderValue(item.value)}
                    <button onClick={() => onDelete(item.id)} className="text-primary-500 hover:text-primary-700 p-1 rounded-full hover:bg-primary-200">
                      <X size={14} />
                    </button>
                </div>
            ))}
        </div>
        
        <div className="pt-2">{form}</div>
      </div>
    </div>
  );
};

const SettingsPage: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const [clinicName, setClinicName] = useState(state.clinicName);
    const [clinicContactNumber, setClinicContactNumber] = useState(state.clinicContactNumber);
    const [clinicLogo, setClinicLogo] = useState(state.clinicLogo);
    const [clinicAddress, setClinicAddress] = useState(state.clinicAddress);
    const [templates, setTemplates] = useState<WhatsAppTemplates>(state.whatsappTemplates);
    
    const [noteShortcut, setNoteShortcut] = useState('');
    const [doctorShortcut, setDoctorShortcut] = useState('');
    const [billingShortcut, setBillingShortcut] = useState({ description: '', amount: '' });
    const [prescriptionShortcut, setPrescriptionShortcut] = useState<Partial<Omit<Prescription, 'id' | 'startDate' | 'endDate'>>>({
        medication: '',
        dosage: '',
        frequency: '',
        instructions: '',
        drugType: 'Analgesic',
        duration: '',
        route: 'Oral',
    });
    
    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Check file size (e.g., 2MB limit)
            if (file.size > 2 * 1024 * 1024) {
                alert("File is too large. Please select a file under 2MB.");
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setClinicLogo(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleUpdateSettings = () => {
        dispatch({ type: ActionType.UPDATE_SETTINGS, payload: { clinicName, clinicContactNumber, clinicLogo, clinicAddress, whatsappTemplates: templates } });
        alert('Settings updated!');
    };

    const handleAddShortcut = (category: ShortcutCategory, value: any) => {
      if(category === 'notes' && typeof value === 'string' && !value.trim()) return;
      if(category === 'doctors' && typeof value === 'string' && !value.trim()) return;

      const newShortcut: Shortcut = {
          id: Date.now().toString(),
          category,
          value,
      } as Shortcut;
      dispatch({ type: ActionType.ADD_SHORTCUT, payload: newShortcut });
    };

    const handleDeleteShortcut = (id: string) => {
        dispatch({ type: ActionType.DELETE_SHORTCUT, payload: { id } });
    };

    const appointmentPlaceholders = [
        { name: 'patient_name', description: 'Patient\'s full name' },
        { name: 'clinic_name', description: 'Your clinic\'s name' },
        { name: 'clinic_contact', description: 'Your clinic\'s contact number' },
        { name: 'clinic_address', description: 'Your clinic\'s address' },
        { name: 'procedure', description: 'Appointment procedure' },
        { name: 'doctor_name', description: 'Doctor\'s name' },
        { name: 'appointment_date', description: 'Formatted date of appointment' },
        { name: 'appointment_time', description: 'Time of appointment' },
    ];

    const reportPlaceholders = [
        ...appointmentPlaceholders.filter(p => !['procedure', 'appointment_date', 'appointment_time'].includes(p.name)),
        { name: 'visit_date', description: 'Date of the patient\'s visit' },
        { name: 'report_summary', description: 'The generated report content' },
    ];


    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-slate-800">Settings</h1>
                 <button onClick={handleUpdateSettings} className="rounded-md bg-primary-700 px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-800">
                    Save All Settings
                  </button>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Clinic Settings</h3>
              <div className="space-y-4">
                <div>
                  <label htmlFor="clinicName" className="block text-sm font-medium text-slate-700">Clinic Name</label>
                  <input
                    id="clinicName"
                    type="text"
                    value={clinicName}
                    onChange={(e) => setClinicName(e.target.value)}
                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  />
                  <p className="text-xs text-slate-500 mt-1">This name will appear on printed reports.</p>
                </div>

                <div>
                  <label htmlFor="clinicContactNumber" className="block text-sm font-medium text-slate-700">Clinic Contact Number</label>
                  <input
                    id="clinicContactNumber"
                    type="text"
                    value={clinicContactNumber}
                    onChange={(e) => setClinicContactNumber(e.target.value)}
                    placeholder="e.g., +91 12345 67890"
                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  />
                  <p className="text-xs text-slate-500 mt-1">This number will be used in WhatsApp messages.</p>
                </div>
                
                <div>
                  <label htmlFor="clinicAddress" className="block text-sm font-medium text-slate-700">Clinic Address</label>
                  <textarea
                    id="clinicAddress"
                    rows={3}
                    value={clinicAddress}
                    onChange={(e) => setClinicAddress(e.target.value)}
                    placeholder="123 Dental Street, Toothville, Pin - 12345"
                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  />
                  <p className="text-xs text-slate-500 mt-1">This address will appear on printed reports and in messages.</p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700">Clinic Logo</label>
                    <div className="mt-2 flex items-center gap-4">
                        <div className="w-24 h-24 bg-slate-100 rounded-lg flex items-center justify-center border border-slate-200">
                            {clinicLogo ? (
                                <img src={clinicLogo} alt="Clinic Logo" className="h-full w-full object-contain rounded-lg p-1" />
                            ) : (
                                <div className="text-slate-400">{ICONS.clinic}</div>
                            )}
                        </div>
                        <div className="flex flex-col gap-2">
                             <input type="file" id="logo-upload" accept="image/png, image/jpeg" onChange={handleLogoChange} className="hidden" />
                             <label htmlFor="logo-upload" className="cursor-pointer rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50">
                                Change Logo
                             </label>
                            {clinicLogo && 
                                <button onClick={() => setClinicLogo('')} className="rounded-md bg-transparent px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50">
                                  Remove Logo
                                </button>
                            }
                        </div>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Recommended: Square image (e.g., PNG, JPG) under 2MB.</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">WhatsApp Templates</h3>
                <p className="text-sm text-slate-500 mb-6">Customize the messages sent to patients via WhatsApp. Use the placeholders to automatically insert patient and appointment details.</p>
                <div className="space-y-6">
                    <TemplateEditor
                        title="Appointment Confirmation"
                        template={templates.appointmentConfirmation}
                        onChange={(e) => setTemplates(p => ({...p, appointmentConfirmation: e.target.value}))}
                        placeholders={appointmentPlaceholders}
                    />
                     <TemplateEditor
                        title="Appointment Reminder"
                        template={templates.appointmentReminder}
                        onChange={(e) => setTemplates(p => ({...p, appointmentReminder: e.target.value}))}
                        placeholders={appointmentPlaceholders}
                    />
                     <TemplateEditor
                        title="Patient Report Summary"
                        template={templates.patientReport}
                        onChange={(e) => setTemplates(p => ({...p, patientReport: e.target.value}))}
                        placeholders={reportPlaceholders}
                    />
                </div>
            </div>

            <h2 className="text-2xl font-bold text-slate-800 border-t pt-6">Shortcuts</h2>
            <p className="text-slate-600">Manage your custom shortcuts to speed up your workflow.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ShortcutManager
                    title="Case Note Shortcuts"
                    category="notes"
                    predefined={PREDEFINED_SHORTCUTS.notes}
                    custom={state.shortcuts.filter(s => s.category === 'notes')}
                    onAdd={(value) => handleAddShortcut('notes', value)}
                    onDelete={handleDeleteShortcut}
                    renderValue={(value) => <span>{value as string}</span>}
                    form={
                        <div className="flex gap-2">
                            <input type="text" value={noteShortcut} onChange={e => setNoteShortcut(e.target.value)} placeholder="Add new note shortcut..." className="flex-grow rounded-md border border-slate-300 p-2 text-sm"/>
                            <button onClick={() => { handleAddShortcut('notes', noteShortcut); setNoteShortcut(''); }} className="flex items-center gap-2 rounded-md bg-primary-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-800">{ICONS.add} Add</button>
                        </div>
                    }
                />
                 <ShortcutManager
                    title="Doctor Name Shortcuts"
                    category="doctors"
                    predefined={PREDEFINED_SHORTCUTS.doctors}
                    custom={state.shortcuts.filter(s => s.category === 'doctors')}
                    onAdd={(value) => handleAddShortcut('doctors', value)}
                    onDelete={handleDeleteShortcut}
                    renderValue={(value) => <span>{value as string}</span>}
                    form={
                        <div className="flex gap-2">
                            <input type="text" value={doctorShortcut} onChange={e => setDoctorShortcut(e.target.value)} placeholder="Add new doctor name..." className="flex-grow rounded-md border border-slate-300 p-2 text-sm"/>
                            <button onClick={() => { handleAddShortcut('doctors', doctorShortcut); setDoctorShortcut(''); }} className="flex items-center gap-2 rounded-md bg-primary-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-800">{ICONS.add} Add</button>
                        </div>
                    }
                />
                <ShortcutManager
                    title="Billing Item Shortcuts"
                    category="billing"
                    predefined={[]}
                    custom={state.shortcuts.filter(s => s.category === 'billing')}
                    onAdd={(value) => handleAddShortcut('billing', value)}
                    onDelete={handleDeleteShortcut}
                    renderValue={(value) => <span>{value.description} (₹{value.amount})</span>}
                    form={
                        <div className="space-y-2">
                            <input type="text" value={billingShortcut.description} onChange={e => setBillingShortcut(p => ({...p, description: e.target.value}))} placeholder="Description..." className="block w-full rounded-md border border-slate-300 p-2 text-sm"/>
                            <div className="flex gap-2">
                                <input type="number" value={billingShortcut.amount} onChange={e => setBillingShortcut(p => ({...p, amount: e.target.value}))} placeholder="Amount (₹)" className="flex-grow rounded-md border border-slate-300 p-2 text-sm"/>
                                <button onClick={() => { handleAddShortcut('billing', { ...billingShortcut, amount: parseFloat(billingShortcut.amount) || 0 }); setBillingShortcut({ description: '', amount: '' }); }} className="flex items-center gap-2 rounded-md bg-primary-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-800">{ICONS.add} Add</button>
                            </div>
                        </div>
                    }
                />
                <ShortcutManager
                    title="Prescription Shortcuts"
                    category="prescriptions"
                    predefined={[]}
                    custom={state.shortcuts.filter(s => s.category === 'prescriptions')}
                    onAdd={(value) => handleAddShortcut('prescriptions', value)}
                    onDelete={handleDeleteShortcut}
                    renderValue={(value) => <span>{value.medication} {value.dosage}</span>}
                    form={
                       <div className="space-y-2">
                           <input type="text" value={prescriptionShortcut.medication} onChange={e => setPrescriptionShortcut(p => ({...p, medication: e.target.value}))} placeholder="Medication..." className="block w-full rounded-md border border-slate-300 p-2 text-sm"/>
                           <div className="grid grid-cols-2 gap-2">
                              <input type="text" value={prescriptionShortcut.dosage} onChange={e => setPrescriptionShortcut(p => ({...p, dosage: e.target.value}))} placeholder="Dosage (e.g., 500mg)" className="rounded-md border border-slate-300 p-2 text-sm"/>
                              <input type="text" value={prescriptionShortcut.frequency} onChange={e => setPrescriptionShortcut(p => ({...p, frequency: e.target.value}))} placeholder="Frequency (e.g., BID)" className="rounded-md border border-slate-300 p-2 text-sm"/>
                           </div>
                           <input type="text" value={prescriptionShortcut.instructions} onChange={e => setPrescriptionShortcut(p => ({...p, instructions: e.target.value}))} placeholder="Instructions (e.g., After food)" className="block w-full rounded-md border border-slate-300 p-2 text-sm"/>
                            <div className="grid grid-cols-2 gap-2">
                              <input type="text" value={prescriptionShortcut.drugType} onChange={e => setPrescriptionShortcut(p => ({...p, drugType: e.target.value}))} placeholder="Drug Type" className="rounded-md border border-slate-300 p-2 text-sm"/>
                              <input type="text" value={prescriptionShortcut.duration} onChange={e => setPrescriptionShortcut(p => ({...p, duration: e.target.value}))} placeholder="Duration" className="rounded-md border border-slate-300 p-2 text-sm"/>
                           </div>
                           <button onClick={() => { handleAddShortcut('prescriptions', prescriptionShortcut); setPrescriptionShortcut({ medication: '', dosage: '', frequency: '', instructions: ''}); }} className="w-full flex justify-center items-center gap-2 rounded-md bg-primary-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-800">{ICONS.add} Add</button>
                       </div>
                    }
                />
            </div>
        </div>
    );
};

export default SettingsPage;