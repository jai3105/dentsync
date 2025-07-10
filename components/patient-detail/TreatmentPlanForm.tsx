import React, { useState } from 'react';
import { TreatmentPlanItem, ActionType } from '../../types';
import { useAppContext } from '../../contexts/AppContext';

const TreatmentPlanForm: React.FC<{
  patientId: string;
  onSuccess: (item: TreatmentPlanItem) => void;
  onCancel: () => void;
  initialData?: TreatmentPlanItem;
}> = ({ patientId, onSuccess, onCancel, initialData }) => {
  const { dispatch } = useAppContext();
  const [formData, setFormData] = useState({
    procedure: initialData?.procedure || '',
    tooth: initialData?.tooth || '',
    cost: initialData?.cost.toString() || '',
    status: initialData?.status || 'Planned',
    date: initialData?.date || new Date().toISOString().split('T')[0],
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.procedure || !formData.cost) return;

    const planItem: TreatmentPlanItem = {
      id: initialData?.id || Date.now().toString(),
      ...formData,
      status: formData.status as 'Planned' | 'In Progress' | 'Completed' | 'On Hold',
      cost: parseFloat(formData.cost),
      isBilled: initialData?.isBilled || false,
    };

    if (initialData) {
      dispatch({ type: ActionType.UPDATE_TREATMENT_PLAN_ITEM, payload: { patientId, item: planItem } });
    } else {
      dispatch({ type: ActionType.ADD_TREATMENT_PLAN_ITEM, payload: { patientId, item: planItem } });
    }
    onSuccess(planItem);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label htmlFor="procedure" className="block text-sm font-medium text-slate-700">Procedure</label>
          <input type="text" name="procedure" value={formData.procedure} onChange={handleChange} required className="mt-1 block w-full rounded-md border-slate-300 shadow-sm" />
        </div>
        <div>
          <label htmlFor="tooth" className="block text-sm font-medium text-slate-700">Tooth # (optional)</label>
          <input type="text" name="tooth" value={formData.tooth} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm" />
        </div>
        <div>
          <label htmlFor="cost" className="block text-sm font-medium text-slate-700">Cost (₹)</label>
          <input type="number" name="cost" value={formData.cost} onChange={handleChange} required className="mt-1 block w-full rounded-md border-slate-300 shadow-sm" />
        </div>
        <div>
          <label htmlFor="date" className="block text-sm font-medium text-slate-700">Date</label>
          <input type="date" name="date" value={formData.date} onChange={handleChange} required className="mt-1 block w-full rounded-md border-slate-300 shadow-sm" />
        </div>
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-slate-700">Status</label>
          <select name="status" value={formData.status} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm">
            <option>Planned</option>
            <option>In Progress</option>
            <option>Completed</option>
            <option>On Hold</option>
          </select>
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-4">
        <button type="button" onClick={onCancel} className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50">Cancel</button>
        <button type="submit" className="flex items-center gap-2 rounded-md bg-primary-700 px-4 py-2 text-sm font-semibold text-white shadow-sm">Save Item</button>
      </div>
    </form>
  );
};

export default TreatmentPlanForm;