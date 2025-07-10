import React, { useState } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { ActionType, Patient } from '../types';
import { ICONS } from '../constants';

interface PatientFormProps {
  onSuccess: (patient: Patient) => void;
  onClose: () => void;
  initialData?: Patient;
}

const PatientForm: React.FC<PatientFormProps> = ({ onSuccess, onClose, initialData }) => {
  const { dispatch } = useAppContext();
  const [formData, setFormData] = useState({
    firstName: initialData?.firstName || '',
    lastName: initialData?.lastName || '',
    dateOfBirth: initialData?.dateOfBirth || '',
    gender: initialData?.gender || 'Other',
    phone: initialData?.phone || '',
    email: initialData?.email || '',
    address: initialData?.address || '',
    allergies: initialData?.medicalHistory?.allergies || '',
    conditions: initialData?.medicalHistory?.conditions || '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName || !formData.dateOfBirth || !formData.phone) {
        alert('Please fill all required fields.');
        return;
    }
    
    const patientData: Patient = {
        id: initialData?.id || Date.now().toString(),
        firstName: formData.firstName,
        lastName: formData.lastName,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender as 'Male' | 'Female' | 'Other',
        phone: formData.phone,
        email: formData.email,
        address: formData.address,
        medicalHistory: { allergies: formData.allergies, conditions: formData.conditions },
        dentalChart: initialData?.dentalChart || {},
        treatmentPlan: initialData?.treatmentPlan || [],
        caseNotes: initialData?.caseNotes || [],
        generalNotes: initialData?.generalNotes || [],
        prescriptions: initialData?.prescriptions || [],
        billing: initialData?.billing || [],
        documents: initialData?.documents || [],
    };

    if(initialData) {
        dispatch({ type: ActionType.UPDATE_PATIENT, payload: patientData });
    } else {
        dispatch({ type: ActionType.ADD_PATIENT, payload: patientData });
    }
    onSuccess(patientData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-slate-700">First Name <span className="text-red-500">*</span></label>
          <input type="text" name="firstName" id="firstName" value={formData.firstName} onChange={handleChange} required className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" />
        </div>
        <div>
          <label htmlFor="lastName" className="block text-sm font-medium text-slate-700">Last Name <span className="text-red-500">*</span></label>
          <input type="text" name="lastName" id="lastName" value={formData.lastName} onChange={handleChange} required className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" />
        </div>
        <div>
          <label htmlFor="dateOfBirth" className="block text-sm font-medium text-slate-700">Date of Birth <span className="text-red-500">*</span></label>
          <input type="date" name="dateOfBirth" id="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} required className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" />
        </div>
        <div>
          <label htmlFor="gender" className="block text-sm font-medium text-slate-700">Gender</label>
          <select name="gender" id="gender" value={formData.gender} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm">
            <option>Male</option>
            <option>Female</option>
            <option>Other</option>
          </select>
        </div>
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-slate-700">Phone <span className="text-red-500">*</span></label>
          <input type="tel" name="phone" id="phone" value={formData.phone} onChange={handleChange} required className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-700">Email Address</label>
          <input type="email" name="email" id="email" value={formData.email} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" />
        </div>
        <div className="md:col-span-2">
            <label htmlFor="address" className="block text-sm font-medium text-slate-700">Address</label>
            <textarea name="address" id="address" value={formData.address} onChange={handleChange} rows={2} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"></textarea>
        </div>
         <div className="md:col-span-2">
            <h4 className="text-sm font-medium text-slate-700 mb-2">Medical History</h4>
            <div className="space-y-2">
              <textarea name="allergies" value={formData.allergies} onChange={handleChange} rows={2} placeholder="Allergies..." className="block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"></textarea>
              <textarea name="conditions" value={formData.conditions} onChange={handleChange} rows={2} placeholder="Ongoing conditions..." className="block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"></textarea>
            </div>
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-4">
        <button type="button" onClick={onClose} className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50">Cancel</button>
        <button type="submit" className="flex items-center gap-2 rounded-md bg-primary-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-800">
          {ICONS.add} Save Patient
        </button>
      </div>
    </form>
  );
};

export default PatientForm;