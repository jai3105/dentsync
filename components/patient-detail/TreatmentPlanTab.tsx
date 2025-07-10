import React, { useState } from 'react';
import { Patient, ActionType, TreatmentPlanItem, BillingEntry, BillingStatus } from '../../types';
import { useAppContext } from '../../contexts/AppContext';
import Modal from '../Modal';
import { ICONS } from '../../constants';
import TreatmentPlanForm from './TreatmentPlanForm';

const TreatmentPlanTab: React.FC<{ patient: Patient }> = ({ patient }) => {
  const { dispatch } = useAppContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<TreatmentPlanItem | undefined>(undefined);
  const [itemToBill, setItemToBill] = useState<TreatmentPlanItem | null>(null);

  const handleOpenModal = (item?: TreatmentPlanItem) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingItem(undefined);
    setIsModalOpen(false);
  };

  const handleFormSuccess = (item: TreatmentPlanItem) => {
    handleCloseModal();
    // If a new or updated item is marked as 'Completed' and not yet billed,
    // automatically open the billing review modal.
    if (item.status === 'Completed' && !item.isBilled) {
      setItemToBill(item);
    }
  };
  
  const handleDelete = (itemId: string) => {
    if (window.confirm('Are you sure you want to delete this plan item?')) {
      dispatch({ type: ActionType.DELETE_TREATMENT_PLAN_ITEM, payload: { patientId: patient.id, itemId } });
    }
  };
  
  const handleAddToBill = (item: TreatmentPlanItem) => {
      if (item.isBilled) {
        alert("This item has already been added to billing.");
        return;
      }
      setItemToBill(item);
  }

  const handleConfirmBilling = () => {
    if (!itemToBill) return;
    const newBillingEntry: BillingEntry = {
        id: Date.now().toString(),
        date: new Date().toISOString().split('T')[0],
        description: `${itemToBill.procedure} (Tooth #${itemToBill.tooth || 'N/A'})`,
        amount: itemToBill.cost,
        status: BillingStatus.Pending,
    };
    dispatch({ type: ActionType.ADD_BILLING, payload: { patientId: patient.id, billing: newBillingEntry, treatmentPlanItemId: itemToBill.id } });
    setItemToBill(null);
  }

  const STATUS_COLORS: { [key: string]: string } = {
    Planned: 'bg-blue-100 text-blue-800',
    'In Progress': 'bg-yellow-100 text-yellow-800',
    Completed: 'bg-green-100 text-green-800',
    'On Hold': 'bg-gray-200 text-gray-800',
  };
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-slate-700">Treatment Plan</h3>
        <button onClick={() => handleOpenModal()} className="flex items-center gap-2 rounded-md bg-primary-700 px-3 py-1.5 text-sm font-semibold text-white shadow-sm">
          {ICONS.add} Add Plan Item
        </button>
      </div>

      {patient.treatmentPlan && patient.treatmentPlan.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-700 uppercase bg-slate-50">
              <tr>
                <th className="px-4 py-2">Procedure</th>
                <th className="px-4 py-2">Tooth</th>
                <th className="px-4 py-2">Cost (₹)</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="text-slate-700">
              {patient.treatmentPlan.map(item => (
                <tr key={item.id} className="border-b">
                  <td className="px-4 py-2 font-medium flex items-center gap-2">
                    {item.procedure}
                    {item.isBilled && <span title="Billed">{ICONS.check}</span>}
                  </td>
                  <td className="px-4 py-2">{item.tooth || 'N/A'}</td>
                  <td className="px-4 py-2">₹{item.cost.toFixed(2)}</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${STATUS_COLORS[item.status]}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-center">
                    <div className="flex justify-center items-center gap-1">
                      {item.status === 'Completed' && (
                          <button 
                            onClick={() => handleAddToBill(item)} 
                            className={`p-1 ${item.isBilled ? 'text-slate-400 cursor-not-allowed' : 'text-green-600 hover:text-green-800'}`}
                            title={item.isBilled ? "Already Billed" : "Add to Bill"}
                            disabled={item.isBilled}
                          >
                            {ICONS.addFile}
                          </button>
                      )}
                      <button onClick={() => handleOpenModal(item)} className="p-1 text-slate-500 hover:text-primary-700" title="Edit">{ICONS.edit}</button>
                      <button onClick={() => handleDelete(item.id)} className="p-1 text-slate-500 hover:text-red-600" title="Delete">{ICONS.delete}</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-center text-slate-500 py-8">No treatment plan items found.</p>
      )}

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingItem ? 'Edit Plan Item' : 'Add Plan Item'}>
        <TreatmentPlanForm 
          patientId={patient.id} 
          onSuccess={handleFormSuccess} 
          onCancel={handleCloseModal} 
          initialData={editingItem} 
        />
      </Modal>

      <Modal
        isOpen={!!itemToBill}
        onClose={() => setItemToBill(null)}
        title="Review & Add to Bill"
        size="md"
      >
        {itemToBill && (
          <div className="space-y-4">
            <p className="text-slate-600">Please review the details before adding this item to the patient's bill.</p>
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
              <div>
                <p className="text-sm font-medium text-slate-500">Procedure</p>
                <p className="text-base text-slate-800 font-semibold">{itemToBill.procedure}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Tooth</p>
                <p className="text-base text-slate-800">{itemToBill.tooth || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Amount to be Billed</p>
                <p className="text-xl font-bold text-primary-700">₹{itemToBill.cost.toFixed(2)}</p>
              </div>
            </div>
            <p className="text-xs text-slate-500">A new <span className="font-semibold">Pending</span> billing entry will be created. This can be managed in the Billing tab.</p>
            <div className="flex justify-end gap-3 pt-4">
              <button type="button" onClick={() => setItemToBill(null)} className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50">Cancel</button>
              <button onClick={handleConfirmBilling} className="flex items-center gap-2 rounded-md bg-primary-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-800">
                Confirm & Add to Bill
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default TreatmentPlanTab;