import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  PatientItem,
  EvaluationRecord,
  ParsedScaleGroup,
  EvaluationSessionDetail,
  formatDateTime,
} from './clinical-report-engine';
import { maskCpf } from './masks';

export interface AiToneReports {
  patient_friendly?: string;
  clinical?: string;
  therapeutic_goals?: string;
}

interface GeneratePdfOptions {
  patient: PatientItem;
  patientRecords: EvaluationRecord[];
  activeScaleGroup?: ParsedScaleGroup | null;
  selectedSession?: EvaluationSessionDetail | null;
  parsedScaleGroups?: ParsedScaleGroup[];
  aiReportText?: string;
  aiToneLabel?: string;
  aiToneReports?: AiToneReports;
}

export function generateClinicalReportPdf({
  patient,
  patientRecords,
  activeScaleGroup,
  selectedSession,
  parsedScaleGroups = [],
  aiReportText,
  aiToneLabel,
  aiToneReports,
}: GeneratePdfOptions) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  let currentY = margin;

  // Colors
  const primaryColor = [30, 64, 175]; // Blue 800
  const secondaryColor = [71, 85, 105]; // Slate 600
  const darkTextColor = [15, 23, 42]; // Slate 900

  // 1. Top Header Banner
  doc.setFillColor(30, 58, 138); // Dark Navy Blue
  doc.rect(0, 0, pageWidth, 24, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text('FISIOMOVIE • GESTÃO E AVALIAÇÃO CLÍNICA', margin, 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(203, 213, 225); // Slate 300
  doc.text('Relatório Oficial de Avaliação e Laudo Fisioterapêutico', margin, 18);

  const emissionDate = new Date().toLocaleDateString('pt-BR');
  doc.setFontSize(8);
  doc.text(`Emissão: ${emissionDate}`, pageWidth - margin - 35, 18);

  currentY = 32;

  // 2. Patient Identification Box
  doc.setFillColor(241, 245, 249); // Slate 100
  doc.roundedRect(margin, currentY, pageWidth - margin * 2, 22, 2, 2, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, currentY, pageWidth - margin * 2, 22, 2, 2, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(`PACIENTE: ${patient.name.toUpperCase()}`, margin + 4, currentY + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`CPF: ${patient.cpf ? maskCpf(patient.cpf) : 'Não informado'}`, margin + 4, currentY + 14);
  doc.text(`Telefone: ${patient.phone || 'Não informado'}`, margin + 65, currentY + 14);
  doc.text(`Total de Avaliações no Histórico: ${patientRecords.length}`, margin + 125, currentY + 14);

  currentY += 28;

  // 3. CASE A: Specific Evaluation Session Selected (Contains all scales of that date)
  if (selectedSession) {
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(margin, currentY, 3, 12, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
    doc.text(`${selectedSession.sessionTitle.toUpperCase()} • ${selectedSession.formattedDate}`, margin + 6, currentY + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.text(
      `Fisioterapeuta Avaliador: ${selectedSession.evaluatorName}${selectedSession.evaluatorCrefito ? ` (CREFITO: ${selectedSession.evaluatorCrefito})` : ''} | Status: ${selectedSession.isSigned ? 'Assinado pelo Paciente' : 'Assinatura Pendente'}`,
      margin + 6,
      currentY + 10
    );

    currentY += 16;

    // List all scales evaluated in this specific session
    selectedSession.scales.forEach((scale, scIdx) => {
      if (currentY > pageHeight - 45) {
        doc.addPage();
        currentY = margin + 5;
      }

      doc.setFillColor(241, 245, 249);
      doc.roundedRect(margin, currentY, pageWidth - margin * 2, 8, 1.5, 1.5, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(30, 58, 138);
      doc.text(`${scIdx + 1}. ${scale.scaleTitle} (${scale.category})`, margin + 3, currentY + 5.5);

      if (scale.scoreSummary) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(15, 23, 42);
        doc.text(`Resultado: ${scale.scoreSummary}`, pageWidth - margin - 4, currentY + 5.5, { align: 'right' });
      }

      currentY += 10;

      if (scale.clinicalInterpretation) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(71, 85, 105);
        doc.text(`Classificação Clínica: ${scale.clinicalInterpretation}`, margin + 3, currentY);
        currentY += 5;
      }

      // Items table for this scale
      const tableHead = [['Parâmetro / Teste Avaliado', 'Resultado Obtido']];
      const tableBody = scale.items.map((it) => [it.label, `${it.value} ${it.unit || ''}`.trim()]);

      autoTable(doc, {
        startY: currentY,
        head: tableHead,
        body: tableBody,
        margin: { left: margin + 2, right: margin + 2 },
        theme: 'grid',
        headStyles: {
          fillColor: [51, 65, 85],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 8,
        },
        styles: {
          fontSize: 8,
          cellPadding: 2,
        },
      });

      currentY = (doc as any).lastAutoTable.finalY + 6;
    });

    // Session Notes & Signature
    if (selectedSession.notes && selectedSession.notes.trim()) {
      if (currentY > pageHeight - 35) {
        doc.addPage();
        currentY = margin + 5;
      }
      const splitNotes = doc.splitTextToSize(`Observações Clínicas: ${selectedSession.notes.trim()}`, pageWidth - margin * 2 - 8);
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(margin, currentY, pageWidth - margin * 2, splitNotes.length * 4.5 + 6, 1.5, 1.5, 'FD');
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(51, 65, 85);
      doc.text(splitNotes, margin + 4, currentY + 5);
      currentY += splitNotes.length * 4.5 + 10;
    }

    if (selectedSession.isSigned && selectedSession.signatureImage) {
      try {
        if (currentY > pageHeight - 25) {
          doc.addPage();
          currentY = margin + 5;
        }
        doc.addImage(selectedSession.signatureImage, 'PNG', margin + 4, currentY, 35, 12);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(100, 116, 139);
        doc.text(`Assinatura do Paciente: ${selectedSession.signedByName || patient.name} (${formatDateTime(selectedSession.signedAt)})`, margin + 42, currentY + 7);
        currentY += 16;
      } catch {
        // ignore
      }
    }
  }

  // 4. CASE B: Specific Scale Selected
  else if (activeScaleGroup) {
    const lastSession = activeScaleGroup.sessions[activeScaleGroup.sessions.length - 1];

    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(margin, currentY, 3, 12, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
    doc.text(`ESCALA CLÍNICA: ${activeScaleGroup.scaleTitle.toUpperCase()}`, margin + 6, currentY + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.text(
      `Categoria: ${activeScaleGroup.category} | Sessões Registradas: ${activeScaleGroup.sessions.length} | Último Resultado: ${lastSession?.scoreSummary || 'N/A'}`,
      margin + 6,
      currentY + 10
    );

    currentY += 16;

    if (lastSession?.clinicalInterpretation) {
      doc.setFillColor(239, 246, 255); // Blue 50
      doc.setDrawColor(191, 219, 254); // Blue 200
      doc.roundedRect(margin, currentY, pageWidth - margin * 2, 10, 1.5, 1.5, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(30, 64, 175);
      doc.text(`Classificação Clínica: ${lastSession.clinicalInterpretation}`, margin + 4, currentY + 6.5);

      currentY += 14;
    }

    // Comparative Evolution Table
    if (activeScaleGroup.sessions.length > 0) {
      if (currentY > pageHeight - 45) {
        doc.addPage();
        currentY = margin + 5;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
      doc.text('EVOLUÇÃO DOS PARÂMETROS / TESTES', margin, currentY);
      currentY += 4;

      const distinctItemLabels = Array.from(
        new Set(activeScaleGroup.sessions.flatMap((s) => s.items.map((it) => it.label)))
      );

      const tableHead = [
        ['Parâmetro / Teste', ...activeScaleGroup.sessions.map((s, idx) => (idx === 0 ? `1ª Avaliação\n(${s.date})` : `${idx + 1}ª Reavaliação\n(${s.date})`))],
      ];

      const tableBody = distinctItemLabels.map((itemLabel) => {
        const row = [itemLabel];
        activeScaleGroup.sessions.forEach((sess) => {
          const matchedItem = sess.items.find((it) => it.label === itemLabel);
          row.push(matchedItem ? `${matchedItem.value} ${matchedItem.unit || ''}`.trim() : '-');
        });
        return row;
      });

      autoTable(doc, {
        startY: currentY,
        head: tableHead,
        body: tableBody,
        margin: { left: margin, right: margin },
        theme: 'grid',
        headStyles: {
          fillColor: [30, 58, 138],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 8,
          halign: 'center',
        },
        columnStyles: {
          0: { halign: 'left', fontStyle: 'bold', cellWidth: 50 },
        },
        styles: {
          fontSize: 8,
          cellPadding: 2.5,
          textColor: [15, 23, 42],
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
      });

      currentY = (doc as any).lastAutoTable.finalY + 8;
    }
  }

  // 5. CASE C: Overview Summary of All Evaluations
  else {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
    doc.text('RESUMO GERAL DE TODAS AS ESCALAS AVALIADAS', margin, currentY);
    currentY += 6;

    const summaryHead = [['Escala Clínica', 'Categoria', 'Sessões', 'Último Resultado', 'Classificação']];
    const summaryBody = parsedScaleGroups.map((g) => {
      const last = g.sessions[g.sessions.length - 1];
      return [
        g.scaleTitle || 'Escala',
        g.category || 'Geral',
        `${g.sessions.length}x`,
        last?.scoreSummary || '-',
        last?.clinicalInterpretation || '-',
      ];
    });

    autoTable(doc, {
      startY: currentY,
      head: summaryHead,
      body: summaryBody,
      margin: { left: margin, right: margin },
      theme: 'grid',
      headStyles: {
        fillColor: [30, 58, 138],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8.5,
      },
      styles: {
        fontSize: 8,
        cellPadding: 2.5,
      },
    });

    currentY = (doc as any).lastAutoTable.finalY + 10;
  }

  // 6. ✨ FINAL SECTION: PARECER CLÍNICO (INCLUI OS 3 TONS SE DISPONÍVEIS OU O ATIVO)
  const renderOpinionBox = (title: string, text: string, barColor: [number, number, number]) => {
    if (!text || !text.trim()) return;

    if (currentY > pageHeight - 45) {
      doc.addPage();
      currentY = margin + 5;
    }

    currentY += 4;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(barColor[0], barColor[1], barColor[2]);
    doc.text(title, margin, currentY);
    currentY += 4;

    const splitText = doc.splitTextToSize(text.trim(), pageWidth - margin * 2 - 10);
    const boxHeight = splitText.length * 4.5 + 8;

    if (currentY + boxHeight > pageHeight - 25) {
      doc.addPage();
      currentY = margin + 5;
    }

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, currentY, pageWidth - margin * 2, boxHeight, 2, 2, 'FD');

    doc.setFillColor(barColor[0], barColor[1], barColor[2]);
    doc.rect(margin, currentY, 3, boxHeight, 'F');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);
    doc.text(splitText, margin + 6, currentY + 6);

    currentY += boxHeight + 6;
  };

  // Check if multiple tone reports are available
  const hasMultipleTones =
    aiToneReports &&
    (Boolean(aiToneReports.patient_friendly?.trim()) ||
      Boolean(aiToneReports.clinical?.trim()) ||
      Boolean(aiToneReports.therapeutic_goals?.trim()));

  if (hasMultipleTones && aiToneReports) {
    if (aiToneReports.patient_friendly?.trim()) {
      renderOpinionBox(
        'PARECER PARA O PACIENTE E FAMÍLIA',
        aiToneReports.patient_friendly,
        [225, 29, 72] // Rose
      );
    }
    if (aiToneReports.clinical?.trim()) {
      renderOpinionBox(
        'LAUDO TÉCNICO FISIOTERAPÊUTICO',
        aiToneReports.clinical,
        [30, 58, 138] // Navy Blue
      );
    }
    if (aiToneReports.therapeutic_goals?.trim()) {
      renderOpinionBox(
        'METAS TERAPÊUTICAS E CONDUTA CLÍNICA',
        aiToneReports.therapeutic_goals,
        [217, 119, 6] // Amber
      );
    }
  } else if (aiReportText && aiReportText.trim()) {
    const toneTitle = aiToneLabel
      ? `PARECER CLÍNICO FINAL • ${aiToneLabel.toUpperCase()}`
      : 'PARECER CLÍNICO FINAL • CONCLUSÃO DA AVALIAÇÃO';
    renderOpinionBox(toneTitle, aiReportText, [79, 70, 229]);
  }

  // 7. Signature Footer & Page Numbers
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Bottom divider
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184); // Slate 400
    doc.text('FisioMovie • Documento de Registro Clínico gerado digitalmente.', margin, pageHeight - 7);
    doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin, pageHeight - 7, { align: 'right' });
  }

  // Save the PDF
  const safePatientName = patient.name.replace(/[^a-zA-Z0-9]/g, '_');
  const sessionSuffix = selectedSession ? `_${selectedSession.sessionTitle.replace(/[^a-zA-Z0-9]/g, '_')}` : '';
  const scaleSuffix = activeScaleGroup ? `_${activeScaleGroup.scaleTitle.replace(/[^a-zA-Z0-9]/g, '_')}` : '';
  const fileName = `Laudo_Clinico_${safePatientName}${sessionSuffix || scaleSuffix || '_Geral'}.pdf`;

  doc.save(fileName);
}

export interface EvolutionChartPoint {
  date: string;
  pain: number;
  functionalScore: number;
  label?: string;
}

export interface EvolutionSessionItem {
  id?: string | number;
  date: string;
  notes?: string;
  painScale?: number;
  specialty?: string;
  professionalName?: string;
  professionalCrefito?: string;
}

export interface GenerateEvolutionPdfOptions {
  patient: PatientItem;
  periodLabel: string;
  startDate?: string;
  endDate?: string;
  summary: string;
  gains?: string[];
  alerts?: string[];
  nextSteps?: string[];
  chartData: EvolutionChartPoint[];
  sessions: EvolutionSessionItem[];
  tone?: string;
  clinicName?: string;
  professionalName?: string;
  professionalCrefito?: string;
}

export function generateEvolutionReportPdf({
  patient,
  periodLabel,
  startDate,
  endDate,
  summary,
  gains = [],
  alerts = [],
  nextSteps = [],
  chartData = [],
  sessions = [],
  tone = 'clinical',
  clinicName = 'FISIOMOVIE • CLÍNICA DE FISIOTERAPIA',
  professionalName,
  professionalCrefito,
}: GenerateEvolutionPdfOptions) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  let currentY = margin;

  // Resolve professional name and CREFITO
  const resolvedProfessionalName =
    professionalName?.trim() ||
    sessions.find((s) => s.professionalName)?.professionalName ||
    patient.professionalName ||
    patient.user?.fullName ||
    (patient as any).user?.name ||
    'Fisioterapeuta Responsável';

  const resolvedProfessionalCrefito =
    professionalCrefito?.trim() ||
    sessions.find((s) => s.professionalCrefito)?.professionalCrefito ||
    patient.professionalCrefito ||
    patient.user?.crefito ||
    '';

  // 1. Top Header Banner
  doc.setFillColor(15, 23, 42); // Slate 900
  doc.rect(0, 0, pageWidth, 24, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text(clinicName.toUpperCase(), margin, 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(148, 163, 184); // Slate 400
  doc.text('Relatório Consolidado de Evolução Clínica e Análise IA', margin, 18);

  const emissionDate = new Date().toLocaleDateString('pt-BR');
  doc.setFontSize(8);
  doc.text(`Emissão: ${emissionDate}`, pageWidth - margin - 35, 18);

  currentY = 30;

  // 2. Patient & Period Information Box
  doc.setFillColor(248, 250, 252); // Slate 50
  doc.roundedRect(margin, currentY, pageWidth - margin * 2, 24, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, currentY, pageWidth - margin * 2, 24, 2, 2, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`PACIENTE: ${patient.name.toUpperCase()}`, margin + 4, currentY + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`CPF: ${patient.cpf ? maskCpf(patient.cpf) : 'Não informado'}`, margin + 4, currentY + 14);
  doc.text(`Telefone: ${patient.phone || 'Não informado'}`, margin + 65, currentY + 14);
  
  const periodText = startDate && endDate ? `${startDate} a ${endDate}` : periodLabel;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 64, 175);
  doc.text(`Período Analisado: ${periodText} (${sessions.length} sessões)`, margin + 4, currentY + 20);

  if (resolvedProfessionalName && resolvedProfessionalName !== 'Fisioterapeuta Responsável') {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    const crefitoTag = resolvedProfessionalCrefito
      ? ` (${resolvedProfessionalCrefito.toUpperCase().startsWith('CREFITO') ? resolvedProfessionalCrefito : `CREFITO: ${resolvedProfessionalCrefito}`})`
      : '';
    doc.text(`Fisioterapeuta: ${resolvedProfessionalName}${crefitoTag}`, margin + 100, currentY + 20);
  }

  currentY += 30;

  // 3. EVOLUTION VECTOR CHART (Pain & Functional Progress)
  if (chartData && chartData.length > 0) {
    const chartX = margin;
    const chartY = currentY;
    const chartW = pageWidth - margin * 2;
    const chartH = 45;

    // Background container
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(chartX, chartY, chartW, chartH, 2, 2, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(chartX, chartY, chartW, chartH, 2, 2, 'S');

    // Chart Header Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text('GRÁFICO DE EVOLUÇÃO TEMPORAL (EVA E RECUPERAÇÃO FUNCIONAL)', chartX + 4, chartY + 6);

    // Legend
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setFillColor(220, 38, 38); // Red
    doc.circle(chartX + chartW - 55, chartY + 5, 1.5, 'F');
    doc.setTextColor(220, 38, 38);
    doc.text('Dor (EVA 0-10)', chartX + chartW - 52, chartY + 6);

    doc.setFillColor(16, 185, 129); // Emerald
    doc.circle(chartX + chartW - 25, chartY + 5, 1.5, 'F');
    doc.setTextColor(16, 185, 129);
    doc.text('Funcional (%)', chartX + chartW - 22, chartY + 6);

    // Plot area coordinates
    const plotX = chartX + 12;
    const plotY = chartY + 10;
    const plotW = chartW - 20;
    const plotH = chartH - 18;

    // Grid lines
    doc.setDrawColor(241, 245, 249);
    doc.setLineWidth(0.2);
    for (let g = 0; g <= 4; g++) {
      const gy = plotY + (plotH / 4) * g;
      doc.line(plotX, gy, plotX + plotW, gy);
    }

    // Y-Axis labels
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text('10', plotX - 5, plotY + 2);
    doc.text('5', plotX - 4, plotY + plotH / 2 + 1);
    doc.text('0', plotX - 4, plotY + plotH);

    // Draw lines & points
    const pointsCount = chartData.length;
    const stepX = pointsCount > 1 ? plotW / (pointsCount - 1) : plotW / 2;

    const coordsPain: { x: number; y: number; val: number; date: string }[] = [];
    const coordsFunc: { x: number; y: number; val: number }[] = [];

    chartData.forEach((pt, idx) => {
      const x = pointsCount === 1 ? plotX + plotW / 2 : plotX + idx * stepX;
      // Pain (0 to 10 -> inverted Y)
      const clampedPain = Math.max(0, Math.min(10, pt.pain ?? 0));
      const yPain = plotY + plotH - (clampedPain / 10) * plotH;
      coordsPain.push({ x, y: yPain, val: clampedPain, date: pt.date });

      // Functional (0 to 100 -> inverted Y)
      const clampedFunc = Math.max(0, Math.min(100, pt.functionalScore ?? 50));
      const yFunc = plotY + plotH - (clampedFunc / 100) * plotH;
      coordsFunc.push({ x, y: yFunc, val: clampedFunc });
    });

    // Draw Functional line (Emerald)
    if (coordsFunc.length > 1) {
      doc.setDrawColor(16, 185, 129);
      doc.setLineWidth(0.6);
      for (let i = 0; i < coordsFunc.length - 1; i++) {
        doc.line(coordsFunc[i].x, coordsFunc[i].y, coordsFunc[i + 1].x, coordsFunc[i + 1].y);
      }
    }

    // Draw Pain line (Red)
    if (coordsPain.length > 1) {
      doc.setDrawColor(220, 38, 38);
      doc.setLineWidth(0.8);
      for (let i = 0; i < coordsPain.length - 1; i++) {
        doc.line(coordsPain[i].x, coordsPain[i].y, coordsPain[i + 1].x, coordsPain[i + 1].y);
      }
    }

    // Draw Dots and Labels
    coordsPain.forEach((pt) => {
      doc.setFillColor(220, 38, 38);
      doc.setDrawColor(255, 255, 255);
      doc.setLineWidth(0.3);
      doc.circle(pt.x, pt.y, 1.4, 'FD');

      // Date on X axis
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6);
      doc.setTextColor(100, 116, 139);
      doc.text(pt.date, pt.x, plotY + plotH + 4.5, { align: 'center' });
    });

    coordsFunc.forEach((pt) => {
      doc.setFillColor(16, 185, 129);
      doc.setDrawColor(255, 255, 255);
      doc.setLineWidth(0.3);
      doc.circle(pt.x, pt.y, 1.2, 'FD');
    });

    currentY += chartH + 6;
  }

  // 4. AI CLINICAL SUMMARY BOX (Font size set before measurement to guarantee text stays strictly inside column)
  if (summary && summary.trim()) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);

    const summaryBoxW = pageWidth - margin * 2;
    const summaryTextW = summaryBoxW - 14;
    const summaryLines = doc.splitTextToSize(summary.trim(), summaryTextW);
    const boxHeight = Math.max(22, summaryLines.length * 4.3 + 14);

    if (currentY + boxHeight > pageHeight - 30) {
      doc.addPage();
      currentY = margin + 5;
    }

    doc.setFillColor(248, 250, 252);
    doc.roundedRect(margin, currentY, summaryBoxW, boxHeight, 2, 2, 'F');
    doc.setDrawColor(199, 210, 254); // Indigo border
    doc.roundedRect(margin, currentY, summaryBoxW, boxHeight, 2, 2, 'S');

    // Left accent bar
    doc.setFillColor(79, 70, 229); // Indigo 600
    doc.rect(margin, currentY, 3, boxHeight, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(67, 56, 202);
    doc.text('SÍNTESE DA EVOLUÇÃO CLÍNICA (INTERPRETAÇÃO IA)', margin + 6, currentY + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);
    doc.text(summaryLines, margin + 6, currentY + 12);

    currentY += boxHeight + 6;
  }

  // 5. FUNCTIONAL GAINS & NEXT STEPS 2-COLUMN BOX
  if ((gains.length > 0 || nextSteps.length > 0) && currentY < 230) {
    const colW = (pageWidth - margin * 2 - 4) / 2;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    const itemMaxW = colW - 8;

    const gainLinesArr = gains.slice(0, 3).map((g) => doc.splitTextToSize(`• ${g}`, itemMaxW));
    const nextLinesArr = nextSteps.slice(0, 3).map((n) => doc.splitTextToSize(`• ${n}`, itemMaxW));

    const totalGainLines = gainLinesArr.reduce((acc, l) => acc + l.length, 0);
    const totalNextLines = nextLinesArr.reduce((acc, l) => acc + l.length, 0);
    const colHeight = Math.max(32, Math.max(totalGainLines, totalNextLines) * 3.6 + 12);

    if (currentY + colHeight > pageHeight - 30) {
      doc.addPage();
      currentY = margin + 5;
    }

    // Column A: Ganhos
    doc.setFillColor(240, 253, 244); // Green 50
    doc.roundedRect(margin, currentY, colW, colHeight, 1.5, 1.5, 'F');
    doc.setDrawColor(187, 247, 208);
    doc.roundedRect(margin, currentY, colW, colHeight, 1.5, 1.5, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(22, 101, 52); // Green 800
    doc.text('GANHOS E PROGRESSOS OBSERVADOS', margin + 3, currentY + 5.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85);
    let gy = currentY + 10;
    gainLinesArr.forEach((gLines) => {
      doc.text(gLines, margin + 3, gy);
      gy += gLines.length * 3.5;
    });

    // Column B: Próximas Condutas
    const colBX = margin + colW + 4;
    doc.setFillColor(239, 246, 255); // Blue 50
    doc.roundedRect(colBX, currentY, colW, colHeight, 1.5, 1.5, 'F');
    doc.setDrawColor(191, 219, 254);
    doc.roundedRect(colBX, currentY, colW, colHeight, 1.5, 1.5, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(30, 64, 175); // Blue 800
    doc.text('CONDUTA E PRÓXIMOS PASSOS', colBX + 3, currentY + 5.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85);
    let ny = currentY + 10;
    nextLinesArr.forEach((nLines) => {
      doc.text(nLines, colBX + 3, ny);
      ny += nLines.length * 3.5;
    });

    currentY += colHeight + 6;
  }

  // 6. CHRONOLOGICAL SESSIONS TABLE (Strict column widths and word breaking to never pass column)
  if (sessions && sessions.length > 0) {
    if (currentY > 215) {
      doc.addPage();
      currentY = margin;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text('HISTÓRICO CRONOLÓGICO DAS SESSÕES DO PERÍODO', margin, currentY + 3);
    currentY += 6;

    const sanitizeNotes = (rawNotes?: string) => {
      if (!rawNotes) return 'Atendimento realizado conforme plano terapêutico.';
      let text = rawNotes
        .replace(/<br\s*[\/]?>/gi, ' ')
        .replace(/<\/p>/gi, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/gi, ' ')
        .replace(/&amp;/gi, '&')
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>')
        .replace(/&quot;/gi, '"')
        .replace(/&#39;/gi, "'")
        .replace(/[\u00A0\u1680\u2000-\u200B\u2028\u2029\u202F\u205F\u3000\uFEFF]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      if (!text) return 'Atendimento realizado conforme plano terapêutico.';

      // Safely break any long unbroken word sequences to prevent escaping cell bounds
      return text
        .split(' ')
        .map((w) => (w.length > 28 ? (w.match(/.{1,26}/g)?.join(' ') || w) : w))
        .join(' ');
    };

    const tableRows = sessions.map((s, idx) => {
      const formattedDate = s.date
        ? s.date.includes('-')
          ? s.date.split('-').reverse().join('/')
          : s.date
        : `Sessão ${idx + 1}`;
      const painText = s.painScale !== undefined && s.painScale !== null ? `EVA ${s.painScale}/10` : '-';
      return [formattedDate, painText, sanitizeNotes(s.notes)];
    });

    const totalTableWidth = pageWidth - margin * 2;
    const colDateWidth = 24;
    const colPainWidth = 20;
    const colNotesWidth = totalTableWidth - colDateWidth - colPainWidth; // Exactly 138mm on A4

    autoTable(doc, {
      startY: currentY,
      head: [['Data', 'Dor (EVA)', 'Anotações e Condutas da Sessão']],
      body: tableRows,
      theme: 'grid',
      tableWidth: totalTableWidth,
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold',
        halign: 'left',
      },
      styles: {
        font: 'helvetica',
        fontStyle: 'normal',
        fontSize: 7.5,
        cellPadding: 2.5,
        textColor: [51, 65, 85],
        overflow: 'linebreak',
        valign: 'top',
        halign: 'left',
      },
      columnStyles: {
        0: { cellWidth: colDateWidth, fontStyle: 'bold', halign: 'left' },
        1: { cellWidth: colPainWidth, halign: 'center' },
        2: { cellWidth: colNotesWidth, halign: 'left', overflow: 'linebreak' },
      },
      margin: { left: margin, right: margin, top: margin, bottom: 15 },
      didDrawPage: (data) => {
        currentY = data.cursor ? data.cursor.y + 10 : currentY;
      },
    });

    currentY = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 12 : currentY + 12;
  }

  // 7. Signature Block with Attending Physiotherapist Name and CREFITO
  if (currentY > pageHeight - 35) {
    doc.addPage();
    currentY = margin + 15;
  }

  const signLineWidth = 85;
  const signX = (pageWidth - signLineWidth) / 2;
  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.4);
  doc.line(signX, currentY + 10, signX + signLineWidth, currentY + 10);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  doc.text(resolvedProfessionalName, pageWidth / 2, currentY + 15, { align: 'center' });

  let displayCrefito = 'CREFITO / Registro Profissional';
  if (resolvedProfessionalCrefito && resolvedProfessionalCrefito.trim()) {
    const rawCrefito = resolvedProfessionalCrefito.trim();
    displayCrefito = rawCrefito.toUpperCase().startsWith('CREFITO') ? rawCrefito : `CREFITO: ${rawCrefito}`;
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(displayCrefito, pageWidth / 2, currentY + 19.5, { align: 'center' });

  // 8. Footer on all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text('FisioMovie • Relatório de Evolução Clínica com IA.', margin, pageHeight - 7);
    doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin, pageHeight - 7, { align: 'right' });
  }

  // Download PDF
  const safePatientName = patient.name.replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`Relatorio_Evolucoes_${safePatientName}.pdf`);
}

