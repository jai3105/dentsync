import { Patient, FinancialTransaction, TreatmentPlanItem, Prescription, Document, Appointment } from '../types';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { TOOTH_IDs, DENTAL_CONDITIONS } from '../constants';
import { format } from 'date-fns';

// Define a type for the jsPDF instance augmented by autoTable
type jsPDFWithLastAutoTable = jsPDF & {
  lastAutoTable: {
    finalY: number;
  };
}


export const exportPatientToPDF = (patient: Patient, clinicName: string, clinicLogo: string, clinicAddress: string, sections: { [key: string]: boolean }) => {
  const doc = new jsPDF() as jsPDFWithLastAutoTable;
  
  // -- Header Section --
  let yPos = 15;

  if (clinicLogo) {
    try {
      doc.addImage(clinicLogo, 'PNG', 14, yPos, 20, 20); // Add logo
      doc.setFontSize(20);
      doc.setTextColor('#5D3EAF');
      doc.text(clinicName, 14 + 25, yPos + 7); // Position text next to logo
      
      doc.setFontSize(9);
      doc.setTextColor(100);
      const addressLines = doc.splitTextToSize(clinicAddress, 80);
      doc.text(addressLines, 14 + 25, yPos + 14);
      
      yPos += 28; // Move Y position down after logo and text
    } catch (e) {
      console.error("Could not add logo to PDF:", e);
      // Fallback if logo fails
      doc.setFontSize(20);
      doc.setTextColor('#5D3EAF');
      doc.text(clinicName, 14, yPos);
      yPos += 8;
      
      doc.setFontSize(9);
      doc.setTextColor(100);
      const addressLines = doc.splitTextToSize(clinicAddress, 180);
      doc.text(addressLines, 14, yPos);
      yPos += (addressLines.length * 4) + 4;
    }
  } else {
    // No logo
    doc.setFontSize(20);
    doc.setTextColor('#5D3EAF');
    doc.text(clinicName, 14, yPos);
    yPos += 8;
    
    doc.setFontSize(9);
    doc.setTextColor(100);
    const addressLines = doc.splitTextToSize(clinicAddress, 180);
    doc.text(addressLines, 14, yPos);
    yPos += (addressLines.length * 4) + 4;
  }
  
  doc.setFontSize(12);
  doc.setTextColor(100);
  doc.text('Patient Report', 14, yPos);
  yPos += 12;

  // -- Patient Info Section --
  doc.setFontSize(16);
  doc.setTextColor(40);
  doc.text(`${patient.firstName} ${patient.lastName}`, 14, yPos);
  yPos += 7;
  doc.setFontSize(10);
  doc.text(`DOB: ${patient.dateOfBirth} | Gender: ${patient.gender}`, 14, yPos);
  yPos += 6;
  doc.text(`Phone: ${patient.phone} | Email: ${patient.email}`, 14, yPos);
  yPos += 6;
  doc.text(`Address: ${patient.address}`, 14, yPos);
  yPos += 15;


  const addSection = (title: string, body: () => void) => {
    if (yPos > 260) {
        doc.addPage();
        yPos = 20;
    }
    doc.setFontSize(14);
    doc.setTextColor('#5D3EAF');
    doc.text(title, 14, yPos);
    yPos += 8;
    body();
    yPos += 10;
  };

  if (sections.dentalChart && patient.dentalChart) {
      addSection('Dental Chart', () => {
        const startX = 14;
        const toothWidth = 8;
        const toothHeight = 12;
        const toothGap = 2;
        
        const drawTooth = (id: string, x: number, y: number) => {
            const condition = patient.dentalChart?.[id]?.condition || 'Healthy';
            const conditionInfo = DENTAL_CONDITIONS[condition as keyof typeof DENTAL_CONDITIONS];
            const hexColor = conditionInfo.hex;

            doc.setFontSize(7);
            doc.setTextColor('#000000');
            doc.text(id, x + toothWidth / 2, y - 4, { align: 'center' });
            
            doc.setDrawColor(40);
            doc.setFillColor(hexColor);
            doc.rect(x, y, toothWidth, toothHeight, 'FD');
        };
        
        yPos += 5; // Extra space for tooth numbers
        let currentX = startX;
        
        // Upper Arch: Right to Left
        [...TOOTH_IDs.upperRight].reverse().forEach(id => {
            drawTooth(id, currentX, yPos);
            currentX += toothWidth + toothGap;
        });
        currentX += toothGap * 2;
        TOOTH_IDs.upperLeft.forEach(id => {
            drawTooth(id, currentX, yPos);
            currentX += toothWidth + toothGap;
        });

        yPos += toothHeight + 15;
        currentX = startX;

        // Lower Arch: Right to Left
        yPos += 5; // Extra space for tooth numbers
         [...TOOTH_IDs.lowerRight].reverse().forEach(id => {
            drawTooth(id, currentX, yPos);
            currentX += toothWidth + toothGap;
        });
        currentX += toothGap * 2;
        TOOTH_IDs.lowerLeft.forEach(id => {
            drawTooth(id, currentX, yPos);
            currentX += toothWidth + toothGap;
        });

        yPos += toothHeight + 15;

        // Legend
        doc.setFontSize(10);
        doc.setTextColor('#5D3EAF');
        doc.text('Legend', 14, yPos);
        yPos += 6;
        
        doc.setFontSize(9);
        doc.setTextColor(40);
        let legendX = startX;
        let legendCol = 0;
        for (const condition of Object.values(DENTAL_CONDITIONS)) {
            if (legendCol === 2) {
                legendCol = 0;
                yPos += 12;
            }
            if (yPos > 260) {
              doc.addPage();
              yPos = 20;
            }
            
            legendX = startX + legendCol * 90;

            doc.setFillColor(condition.hex);
            doc.setDrawColor(40);
            doc.rect(legendX, yPos, 5, 5, 'FD');
            doc.text(`${condition.name}:`, legendX + 7, yPos + 4);
            doc.text(condition.description, legendX + 7, yPos + 9, { maxWidth: 75 });
            legendCol++;
        }
        yPos += 15;
      });
  }

  if (sections.treatmentPlan && patient.treatmentPlan?.length > 0) {
    addSection('Treatment Plan', () => {
        autoTable(doc, {
            startY: yPos,
            head: [['Date', 'Procedure', 'Tooth', 'Cost (INR)', 'Status']],
            body: patient.treatmentPlan.map((p: TreatmentPlanItem) => [p.date, p.procedure, p.tooth, `₹${p.cost.toFixed(2)}`, p.status]),
            theme: 'grid',
            headStyles: { fillColor: '#5D3EAF' },
        });
        yPos = doc.lastAutoTable.finalY;
    });
  }

  if (sections.prescriptions && patient.prescriptions?.length > 0) {
    addSection('Prescriptions', () => {
        autoTable(doc, {
            startY: yPos,
            head: [['Medication', 'Type', 'Dosage', 'Duration', 'Status']],
            body: patient.prescriptions.map((p: Prescription) => [p.medication, p.drugType, p.dosage, p.duration, p.status]),
            theme: 'grid',
            headStyles: { fillColor: '#5D3EAF' },
        });
        yPos = doc.lastAutoTable.finalY;
    });
  }

  if (sections.caseNotes && patient.caseNotes?.length > 0) {
    addSection('Case Notes', () => {
      autoTable(doc, {
        startY: yPos,
        head: [['Date', 'Note']],
        body: patient.caseNotes.map(n => [n.date, n.note]),
        theme: 'striped',
        headStyles: { fillColor: '#5D3EAF' },
        didParseCell: (data) => {
            if (data.column.dataKey === 'note') {
                data.cell.styles.cellWidth = 'auto';
            }
        }
      });
      yPos = doc.lastAutoTable.finalY;
    });
  }
  
  if (sections.billing && patient.billing.length > 0) {
    addSection('Billing', () => {
        autoTable(doc, {
            startY: yPos,
            head: [['Date', 'Description', 'Amount (INR)', 'Status']],
            body: patient.billing.map(b => [b.date, b.description, `₹${b.amount.toFixed(2)}`, b.status]),
            theme: 'grid',
            headStyles: { fillColor: '#5D3EAF' },
        });
        yPos = doc.lastAutoTable.finalY;
    });
    const outstanding = patient.billing
        .filter(b => b.status === 'Pending')
        .reduce((sum, b) => sum + b.amount, 0);
    if(outstanding > 0) {
        doc.setFontSize(12);
        doc.setTextColor('#d97706');
        doc.text(`Total Outstanding: ₹${outstanding.toFixed(2)}`, 14, yPos + 8);
    }
  }

  if (sections.documents && patient.documents?.length > 0) {
    addSection('Documents', () => {
        autoTable(doc, {
            startY: yPos,
            head: [['File Name', 'Type', 'Uploaded Date']],
            body: patient.documents.map((d: Document) => [d.name, d.type, new Date(d.uploadedAt).toLocaleDateString()]),
            theme: 'grid',
            headStyles: { fillColor: '#5D3EAF' },
        });
        yPos = doc.lastAutoTable.finalY;
    });
  }

  doc.save(`Patient_Report_${patient.firstName}_${patient.lastName}.pdf`);
};

const replacePlaceholders = (template: string, replacements: { [key: string]: string }): string => {
    let message = template;
    for (const key in replacements) {
        // Use a regex to replace all occurrences of {{key}}
        message = message.replace(new RegExp(`{{${key}}}`, 'g'), replacements[key]);
    }
    return message;
};

export const exportPatientToWhatsAppMessage = (
    patient: Patient, 
    clinicName: string,
    clinicContactNumber: string,
    clinicAddress: string,
    sections: { [key: string]: boolean },
    options: { doctorName: string; visitDate: string; },
    template: string
): string => {
    const { doctorName, visitDate } = options;
    
    let reportSummary = ``;
    let contentAdded = false;

    if (sections.dentalChart && patient.dentalChart) {
        const chartEntries = Object.entries(patient.dentalChart).filter(([, data]) => data.condition !== 'Healthy');
        if (chartEntries.length > 0) {
            reportSummary += `*Dental Summary*:\n`;
            chartEntries.forEach(([toothId, data]) => {
                reportSummary += `- Tooth ${toothId}: ${data.condition}${data.notes ? ` (${data.notes})` : ''}\n`;
            });
            reportSummary += `\n`;
            contentAdded = true;
        }
    }

    if (sections.treatmentPlan && patient.treatmentPlan?.length > 0) {
        reportSummary += `*Treatment Plan*:\n`;
        patient.treatmentPlan.forEach(item => {
            reportSummary += `- ${item.procedure} (Tooth: ${item.tooth || 'N/A'}), Cost: ₹${item.cost.toFixed(2)}, Status: ${item.status}\n`;
        });
        reportSummary += `\n`;
        contentAdded = true;
    }
    
    if (sections.prescriptions && patient.prescriptions?.length > 0) {
        reportSummary += `*Prescriptions*:\n`;
        patient.prescriptions.forEach(p => {
            reportSummary += `- ${p.medication} ${p.dosage} (${p.status})\n`;
        });
        reportSummary += `\n`;
        contentAdded = true;
    }

    if (sections.caseNotes && patient.caseNotes?.length > 0) {
        reportSummary += `*Recent Case Notes*:\n`;
        patient.caseNotes.slice(-2).forEach(n => {
             reportSummary += `- (${n.date}) ${n.note}\n`;
        });
        reportSummary += `\n`;
        contentAdded = true;
    }

    if (sections.billing && patient.billing.length > 0) {
        const outstanding = patient.billing
            .filter(b => b.status === 'Pending')
            .reduce((sum, b) => sum + b.amount, 0);
        reportSummary += `*Billing Summary*:\n`;
        reportSummary += `- Total Outstanding: *₹${outstanding.toFixed(2)}*\n`;
        reportSummary += `\n`;
        contentAdded = true;
    }
    
    if (!contentAdded) {
        reportSummary += `No information to report for the selected sections.\n`;
    }

    const replacements = {
        patient_name: `${patient.firstName} ${patient.lastName}`,
        clinic_name: clinicName,
        clinic_contact: clinicContactNumber || '[Clinic Phone Number]',
        clinic_address: clinicAddress || '[Clinic Address]',
        visit_date: visitDate,
        doctor_name: doctorName,
        report_summary: reportSummary.trim(),
    };

    return replacePlaceholders(template, replacements);
}

export const exportAppointmentConfirmationToWhatsAppMessage = (
    appointment: Appointment,
    patient: Patient,
    clinicName: string,
    clinicContactNumber: string,
    clinicAddress: string,
    template: string
): string => {
    const replacements = {
        patient_name: `${patient.firstName} ${patient.lastName}`,
        clinic_name: clinicName,
        clinic_contact: clinicContactNumber || '[Clinic Phone Number]',
        clinic_address: clinicAddress || '[Clinic Address]',
        procedure: appointment.procedure,
        doctor_name: appointment.doctor,
        appointment_date: format(new Date(appointment.date), 'EEEE, MMMM do, yyyy'),
        appointment_time: appointment.time,
    };
    return replacePlaceholders(template, replacements);
};

export const exportAppointmentReminderToWhatsAppMessage = (
    appointment: Appointment,
    patient: Patient,
    clinicName: string,
    clinicContactNumber: string,
    clinicAddress: string,
    template: string
): string => {
    const replacements = {
        patient_name: `${patient.firstName} ${patient.lastName}`,
        clinic_name: clinicName,
        clinic_contact: clinicContactNumber || '[Clinic Phone Number]',
        clinic_address: clinicAddress || '[Clinic Address]',
        procedure: appointment.procedure,
        doctor_name: appointment.doctor,
        appointment_date: format(new Date(appointment.date), 'EEEE, MMMM do, yyyy'),
        appointment_time: appointment.time,
    };
    return replacePlaceholders(template, replacements);
};


export const exportFinancialsToCSV = (transactions: FinancialTransaction[]) => {
  const headers = ['Date', 'Type', 'Category', 'Description', 'Amount (INR)'];
  const rows = transactions.map(t => [
    t.date,
    t.type,
    t.category,
    `"${t.description.replace(/"/g, '""')}"`,
    t.amount.toFixed(2)
  ]);

  const csvContent = "data:text/csv;charset=utf-8," 
    + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', 'financial_report.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportFinancialsToPDF = (transactions: FinancialTransaction[], summary: { income: number; expense: number; net: number }, dateRange: { start: string, end: string }, clinicName: string, clinicLogo: string, clinicAddress: string) => {
    const doc = new jsPDF() as jsPDFWithLastAutoTable;
    let yPos = 20;
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    if (clinicLogo) {
        try {
            doc.addImage(clinicLogo, 'PNG', 14, 15, 20, 20);
        } catch (e) {
            console.error("Could not add logo to financial PDF:", e);
        }
    }
    
    doc.setFontSize(20);
    doc.setTextColor('#5D3EAF');
    doc.text("Financial Report", pageWidth / 2, yPos, { align: "center" });
    yPos += 10;
    
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(clinicName, pageWidth / 2, yPos, { align: "center" });
    yPos += 6;
    
    doc.setFontSize(9);
    doc.setTextColor(100);
    const addressLines = doc.splitTextToSize(clinicAddress, 180);
    doc.text(addressLines, pageWidth / 2, yPos, { align: 'center' });
    yPos += (addressLines.length * 4) + 6;

    // Date Range
    if (dateRange.start && dateRange.end) {
        doc.setFontSize(10);
        doc.text(`Period: ${dateRange.start} to ${dateRange.end}`, pageWidth / 2, yPos, { align: "center" });
        yPos += 15;
    } else {
      yPos += 10;
    }
    
    // Summary
    doc.setFontSize(12);
    doc.text(`Total Income: ₹${summary.income.toFixed(2)}`, 14, yPos);
    doc.text(`Total Expenses: ₹${summary.expense.toFixed(2)}`, doc.internal.pageSize.getWidth() / 2, yPos);
    yPos += 8;
    doc.text(`Net Balance: ₹${summary.net.toFixed(2)}`, 14, yPos);
    yPos += 15;

    // Table
    autoTable(doc, {
        startY: yPos,
        head: [['Date', 'Type', 'Category', 'Description', 'Amount (₹)']],
        body: transactions.map(t => [
            t.date,
            t.type,
            t.category,
            t.description,
            { content: t.amount.toFixed(2), styles: { halign: 'right' } }
        ]),
        theme: 'grid',
        headStyles: { fillColor: '#5D3EAF' },
        styles: { fontSize: 9 },
        columnStyles: {
            4: { cellWidth: 30 }
        }
    });

    doc.save('financial_report.pdf');
};