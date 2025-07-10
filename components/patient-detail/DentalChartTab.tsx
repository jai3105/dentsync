import React, { useState } from 'react';
import { Patient, ActionType, DentalChartData } from '../../types';
import { useAppContext } from '../../contexts/AppContext';
import Modal from '../Modal';
import { ICONS, TOOTH_IDs, DENTAL_CONDITIONS, PEDO_TOOTH_IDs } from '../../constants';

type ToothData = DentalChartData[string];
type ToothCondition = ToothData['condition'];

const CONDITION_COLORS: { [key: string]: string } = Object.fromEntries(
    Object.entries(DENTAL_CONDITIONS).map(([key, value]) => [key, `fill-${value.color}`])
);


const EditToothModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  toothId: string;
  currentData: ToothData;
  onSave: (data: ToothData) => void;
}> = ({ isOpen, onClose, toothId, currentData, onSave }) => {
  const [condition, setCondition] = useState<ToothCondition>(currentData.condition);
  const [notes, setNotes] = useState(currentData.notes);

  const handleSave = () => {
    onSave({ condition, notes });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Edit Tooth #${toothId}`}>
      <div className="space-y-4">
        <div>
          <label htmlFor="condition" className="block text-sm font-medium text-slate-700">Condition</label>
          <select
            id="condition"
            value={condition}
            onChange={(e) => setCondition(e.target.value as ToothCondition)}
            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
          >
            {Object.keys(CONDITION_COLORS).map(cond => (
              <option key={cond} value={cond}>{cond}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-slate-700">Notes</label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
          />
        </div>
        <div className="flex justify-end gap-3 pt-4">
          <button type="button" onClick={onClose} className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50">Cancel</button>
          <button onClick={handleSave} className="flex items-center gap-2 rounded-md bg-primary-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-800">
            Save
          </button>
        </div>
      </div>
    </Modal>
  );
};

const DentalArch: React.FC<{
  toothIds: string[];
  chartData: DentalChartData;
  onToothClick: (toothId: string) => void;
}> = ({ toothIds, chartData, onToothClick }) => {
    return (
        <div className="flex flex-row">
            {toothIds.map(id => {
                 const toothState = chartData[id] || { condition: 'Healthy' };
                 const colorClass = CONDITION_COLORS[toothState.condition] || 'fill-white';
                 return (
                    <div key={id} onClick={() => onToothClick(id)} className="w-10 h-16 m-1 cursor-pointer flex flex-col items-center justify-center group">
                        <span className="text-xs font-semibold text-slate-500">{id}</span>
                        <svg viewBox="0 0 100 150" className="w-full h-full">
                            <path d="M20,10 C20,0 80,0 80,10 L90,80 C90,90 70,140 50,140 C30,140 10,90 10,80 Z" 
                                className={`stroke-slate-600 stroke-2 group-hover:stroke-primary-700 transition-all ${colorClass}`} />
                        </svg>
                    </div>
                );
            })}
        </div>
    );
};

const DentalChartTab: React.FC<{ patient: Patient }> = ({ patient }) => {
  const { dispatch } = useAppContext();
  const [selectedTooth, setSelectedTooth] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [chartType, setChartType] = useState<'permanent' | 'pedo'>('permanent');

  const handleToothClick = (toothId: string) => {
    setSelectedTooth(toothId);
  };

  const handleSaveToothData = (data: ToothData) => {
    if (!selectedTooth) return;
    const newChartData: DentalChartData = {
      ...patient.dentalChart,
      [selectedTooth]: data,
    };
    dispatch({ type: ActionType.UPDATE_DENTAL_CHART, payload: { patientId: patient.id, chartData: newChartData } });
  };
  
  const defaultToothData: ToothData = { condition: 'Healthy', notes: '' };
  const currentToothData = selectedTooth ? (patient.dentalChart?.[selectedTooth] ?? defaultToothData) : defaultToothData;

  const renderChart = () => {
      if (chartType === 'permanent') {
          return <>
              <div className="flex justify-center">
                  <DentalArch toothIds={TOOTH_IDs.upperRight} chartData={patient.dentalChart} onToothClick={handleToothClick} />
                  <div className="w-2 border-r-2 border-slate-300 mx-1"></div>
                  <DentalArch toothIds={TOOTH_IDs.upperLeft} chartData={patient.dentalChart} onToothClick={handleToothClick} />
              </div>
              <div className="h-6"></div>
              <div className="flex justify-center">
                  <DentalArch toothIds={TOOTH_IDs.lowerRight} chartData={patient.dentalChart} onToothClick={handleToothClick} />
                  <div className="w-2 border-r-2 border-slate-300 mx-1"></div>
                  <DentalArch toothIds={TOOTH_IDs.lowerLeft} chartData={patient.dentalChart} onToothClick={handleToothClick} />
              </div>
          </>;
      } else {
          return <>
              <div className="flex justify-center">
                  <DentalArch toothIds={PEDO_TOOTH_IDs.upperRight} chartData={patient.dentalChart} onToothClick={handleToothClick} />
                  <div className="w-2 border-r-2 border-slate-300 mx-1"></div>
                  <DentalArch toothIds={PEDO_TOOTH_IDs.upperLeft} chartData={patient.dentalChart} onToothClick={handleToothClick} />
              </div>
              <div className="h-6"></div>
              <div className="flex justify-center">
                  <DentalArch toothIds={PEDO_TOOTH_IDs.lowerRight} chartData={patient.dentalChart} onToothClick={handleToothClick} />
                  <div className="w-2 border-r-2 border-slate-300 mx-1"></div>
                  <DentalArch toothIds={PEDO_TOOTH_IDs.lowerLeft} chartData={patient.dentalChart} onToothClick={handleToothClick} />
              </div>
          </>;
      }
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-slate-700">Interactive Dental Chart</h3>
         <div className="flex items-center p-1 bg-slate-200 rounded-lg">
            <button
              onClick={() => setChartType('permanent')}
              className={`px-3 py-1 text-sm font-semibold rounded-md ${chartType === 'permanent' ? 'bg-white text-primary-700 shadow' : 'text-slate-600'}`}
            >
              Permanent
            </button>
            <button
              onClick={() => setChartType('pedo')}
              className={`px-3 py-1 text-sm font-semibold rounded-md ${chartType === 'pedo' ? 'bg-white text-primary-700 shadow' : 'text-slate-600'}`}
            >
              Pediatric
            </button>
        </div>
      </div>
      <div className="flex flex-col items-center p-4 bg-slate-50 rounded-lg overflow-x-auto custom-scrollbar">
          {renderChart()}
      </div>
       <div className="mt-6 pt-4 border-t">
          <h4 className="text-md font-semibold text-slate-600 mb-3">Legend</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
              {Object.values(DENTAL_CONDITIONS).map((condition) => (
                  <div key={condition.name} className="flex items-start gap-3">
                      <div className={`w-5 h-5 mt-0.5 rounded-full border border-slate-400 flex-shrink-0 bg-${condition.color}`}></div>
                      <div>
                          <p className="font-semibold text-slate-800">{condition.name}</p>
                          <p className="text-sm text-slate-500">{condition.description}</p>
                      </div>
                  </div>
              ))}
          </div>
      </div>

      {selectedTooth && (
        <div className="mt-6 pt-6 border-t">
          <div className="flex justify-between items-center mb-3">
             <h4 className="text-md font-semibold text-slate-700">
              Summary for Tooth #{selectedTooth}
            </h4>
             <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
            >
              {ICONS.edit} Edit
            </button>
          </div>
          <div className="bg-primary-50 p-4 rounded-lg">
              <p>
                <strong className="font-medium text-slate-600">Condition: </strong>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full bg-${DENTAL_CONDITIONS[currentToothData.condition].color} text-black`}>{currentToothData.condition}</span>
              </p>
              <p className="mt-2">
                <strong className="font-medium text-slate-600">Notes: </strong>
                <span className="text-slate-800 whitespace-pre-wrap">
                  {currentToothData.notes || 'No notes for this tooth.'}
                </span>
              </p>
          </div>
        </div>
      )}
      
      {selectedTooth && (
        <EditToothModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          toothId={selectedTooth}
          currentData={currentToothData}
          onSave={handleSaveToothData}
        />
      )}
    </div>
  );
};

export default DentalChartTab;