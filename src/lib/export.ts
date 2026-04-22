
"use client";

import type { ThoughtEntry } from '@/types';
import type { JournalStats, JournalAnalysis } from '@/hooks/use-cbt-journal';
import { calculateICC, escapeHtml } from './utils';
import type { TFunction } from '@/hooks/use-translation';

const generateInsightText = (analysis: JournalAnalysis, t: TFunction): string => {
    if (analysis.insight) return analysis.insight;
    return t('report_insufficient_data');
}

const safeCsv = (value: any): string => {
    if (value === null || value === undefined) return '';
    let str = String(value);
    str = str.replace(/"/g, '""'); // Escape double quotes
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        str = `"${str}"`; // Wrap in double quotes
    }
    return str;
};

export const generateCsvContent = (rows: ThoughtEntry[]): string => {
    const headers = [
        'id', 'timestamp', 'date', 'level', 'emotion', 'intensity', 
        'situation', 'automaticThought', 'originalIntensity', 'finalCredibility', 
        'alternativeResponse', 'note', 'tags', 'promptUsed', '__draft'
    ];

    let csv = headers.map(safeCsv).join(',') + '\n';

    rows.forEach(row => {
        const values = headers.map(header => {
            let value = row[header as keyof ThoughtEntry];
            if (header === 'tags' && Array.isArray(value)) {
                value = value.join(';');
            }
            return safeCsv(value);
        });
        csv += values.join(',') + '\n';
    });

    return csv;
}


export const generateReportContent = (rows: ThoughtEntry[], stats: JournalStats, analysis: JournalAnalysis, t: TFunction): string => {
    const insightText = generateInsightText(analysis, t);

    const iccMetric = stats.avgICC
        ? `* **${t('report_avg_icc_title')}:** ${stats.avgICC} (${t('report_avg_icc_desc')}).\n`
        : '';

    let reportContent = `# 🧠 ${t('report_title')}\n\n`;
    reportContent += `**${t('report_generation_date')}:** ${new Date().toLocaleDateString(t('locale'), { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}\n`;
    reportContent += `**${t('report_total_sessions')}:** ${stats.total}\n`;
    reportContent += `**${t('report_l3_sessions')}:** ${stats.totalL3}\n\n`;
    
    reportContent += `---\n\n`;
    reportContent += `## I. ${t('report_summary_title')}\n\n`;
    reportContent += `> **${t('report_main_insight')}:** ${escapeHtml(insightText).replace(/\*\*/g, '')}\n\n`;
    reportContent += `* **${t('report_streak')}:** ${t('report_streak_value', { count: stats.streak })}\n`;
    reportContent += `* **${t('report_avg_intensity')}:** ${stats.avgIntensity}/10\n`;
    reportContent += `* **${t('report_top_emotion')}:** ${escapeHtml(stats.topEmotion)} (${t('report_top_emotion_desc')})\n`;
    reportContent += iccMetric;
    reportContent += `\n`;

    // --- New Analysis Sections ---

    if (analysis.iccByEmotion.length > 0) {
        reportContent += `### ${t('icc_by_emotion_title')}\n\n`;
        reportContent += `| ${t('emotion_label')} | ${t('report_avg_icc_title')} | ${t('report_l3_sessions')} |\n`;
        reportContent += `| :--- | :--- | :--- |\n`;
        analysis.iccByEmotion.forEach(item => {
            reportContent += `| ${escapeHtml(item.emotion)} | **${item.avgICC}** | ${item.count} |\n`;
        });
        reportContent += `\n`;
    }

    if (analysis.triggers.length > 0) {
        reportContent += `### ${t('main_triggers_title')}\n\n`;
        reportContent += `| ${t('report_table_trigger')} | ${t('report_table_frequency')} | ${t('report_avg_intensity')} |\n`;
        reportContent += `| :--- | :--- | :--- |\n`;
        analysis.triggers.forEach(trigger => {
            reportContent += `| ${escapeHtml(trigger.situation)} | ${trigger.count} | ${trigger.avgIntensity}/10 |\n`;
        });
        reportContent += `\n`;
    }

    // --- End of New Analysis Sections ---


    reportContent += `## II. ${t('report_distribution_title')}\n\n`;
    reportContent += `### ${t('report_level_distribution_title')}\n`;
    reportContent += `| ${t('report_table_level')} | ${t('report_table_description')} | ${t('report_table_frequency')} |\n`;
    reportContent += `| :--- | :--- | :--- |\n`;
    reportContent += `| L1 | ${t('level1_short_desc')} | ${t('report_session_count', { count: stats.levelCount[1] || 0 })} |\n`;
    reportContent += `| L2 | ${t('level2_short_desc')} | ${t('report_session_count', { count: stats.levelCount[2] || 0 })} |\n`;
    reportContent += `| L3 | ${t('level3_short_desc')} | ${t('report_session_count', { count: stats.levelCount[3] || 0 })} |\n\n`;

    const emotionEntries = Object.entries(stats.emotionFreq).sort(([, a], [, b]) => b - a).slice(0, 5);
    if (emotionEntries.length > 0) {
        reportContent += `### ${t('report_top_emotions_title')}\n`;
        emotionEntries.forEach(([emotion, count]) => {
            reportContent += `* **${escapeHtml(emotion)}**: ${t('report_times_count', { count })}\n`;
        });
        reportContent += `\n`;
    }

    const tagEntries = Object.entries(stats.tagFreq).sort(([, a], [, b]) => b - a).slice(0, 5);
    if (tagEntries.length > 0) {
        reportContent += `### ${t('report_top_tags_title')}\n`;
        tagEntries.forEach(([tag, count]) => {
            reportContent += `* **#${escapeHtml(tag)}**: ${t('report_times_count', { count })}\n`;
        });
        reportContent += `\n`;
    }

    reportContent += `## III. ${t('report_latest_entries_title')}\n\n`;
    reportContent += `| ${t('report_table_date')} | ${t('report_table_level')} | ${t('report_table_emotion_intensity')} | ${t('report_table_icc')} | ${t('report_table_trigger')} | ${t('report_table_auto_thought')} | ${t('report_table_alt_response')} |\n`;
    reportContent += `| :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n`;

    rows.slice(0, 10).forEach(r => {
        const safeText = (text: string | undefined) => escapeHtml(text || '').replace(/\|/g, '/').substring(0, 20) + (text && text.length > 20 ? '...' : '');
        const iccValue = calculateICC(r.originalIntensity, r.finalCredibility) ?? '—';
        reportContent += `| ${r.date} | L${r.level} | ${escapeHtml(r.emotion)} (${r.intensity}/10) | ${iccValue} | ${safeText(r.situation)} | ${safeText(r.automaticThought)} | ${safeText(r.alternativeResponse)} |\n`;
    });
    reportContent += `\n\n---\n\n`;
    reportContent += `*${t('report_footer')}*`;

    return reportContent;
};

export const generateL3ReportContent = (l3Rows: ThoughtEntry[], t: TFunction): string => {
    let reportContent = `# ✨ ${t('l3_report_title')}\n\n`;
    reportContent += `**${t('report_generation_date')}:** ${new Date().toLocaleDateString(t('locale'), { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}\n`;
    reportContent += `**${t('l3_report_total_sessions')}:** ${l3Rows.length}\n\n`;
    reportContent += `---\n\n`;
    reportContent += `> ${t('l3_report_subtitle')}\n\n`;

    l3Rows.forEach((r, index) => {
        const iccValue = calculateICC(r.originalIntensity, r.finalCredibility) ?? '—';

        reportContent += `## ${index + 1}. ${t('l3_report_item_title')}: ${r.date}\n\n`;
        reportContent += `* **${t('l3_report_item_situation')}:** ${escapeHtml(r.situation)}\n`;
        reportContent += `* **${t('l3_report_item_auto_thought')}:** ${escapeHtml(r.automaticThought)}\n`;
        reportContent += `* **${t('l3_report_item_intensity')}:** ${r.originalIntensity || '—'}/10 → ${r.finalCredibility || '—'}/10\n`;
        reportContent += `* **${t('l3_report_item_impact')}:** **${iccValue}**\n\n`;
        reportContent += `**✅ ${t('l3_report_item_alt_response')}:**\n`;
        reportContent += `> ${escapeHtml(r.alternativeResponse)}\n\n`;
        reportContent += `--- \n\n`;
    });

    reportContent += `*${t('l3_report_footer')}*`;
    return reportContent;
};

export const generateFhirObservation = (entries: ThoughtEntry[], stats: JournalStats, t: TFunction) => {
  const latestEntry = entries[0];
  if (!latestEntry) return null;

  const latestIcc = calculateICC(latestEntry.originalIntensity, latestEntry.finalCredibility);
  const distressScore = Math.max(latestEntry.intensity || 0, stats.avgIntensity || 0);
  const interpretation = distressScore >= 9
    ? [{
        coding: [{
          system: "http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation",
          code: "HH",
          display: "Critical high",
        }],
        text: "Very high self-reported distress. This is not a diagnosis; consider using the safety plan and urgent local support if risk is present.",
      }]
    : distressScore >= 7
      ? [{
          coding: [{
            system: "http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation",
            code: "H",
            display: "High",
          }],
          text: "Elevated self-reported distress. This is descriptive self-report data, not a clinical diagnosis.",
        }]
      : undefined;

  const component = [
    {
      code: { text: "Total Sessions" },
      valueInteger: stats.total,
    },
    {
      code: { text: "Consistency Streak (days)" },
      valueInteger: stats.streak,
    },
    {
      code: { text: "Average Self-Reported Distress" },
      valueQuantity: {
        value: stats.avgIntensity,
        unit: "/10",
        system: "http://unitsofmeasure.org",
        code: "{score}",
      },
    },
    {
      code: { text: "Most Frequent Emotion" },
      valueString: stats.topEmotion,
    },
    {
      code: { text: "Latest Entry Emotion" },
      valueString: latestEntry.emotion,
    },
    {
      code: { text: "Latest Entry Intensity" },
      valueQuantity: {
        value: latestEntry.intensity,
        unit: "/10",
        system: "http://unitsofmeasure.org",
        code: "{score}",
      },
    },
  ];

  if (latestIcc !== null) {
    component.push({
      code: { text: "Latest Cognitive Change Index (ICC)" },
      valueQuantity: {
        value: parseFloat(latestIcc),
        unit: "ratio",
        system: "http://unitsofmeasure.org",
        code: "{ratio}",
      },
    });
  }

  if (stats.avgICC !== null) {
    component.push({
      code: { text: "Average Cognitive Change Index (ICC)" },
      valueQuantity: {
        value: parseFloat(stats.avgICC),
        unit: "ratio",
        system: "http://unitsofmeasure.org",
        code: "{ratio}",
      },
    });
  }

  return {
    resourceType: "Observation",
    id: `cognit-self-report-summary-${new Date().getTime()}`,
    status: "final",
    category: [
      {
        coding: [
          {
            system: "http://terminology.hl7.org/CodeSystem/observation-category",
            code: "survey",
            display: "Survey",
          },
        ],
        text: "Cognitive Behavioral Therapy Journal Summary",
      },
    ],
    code: {
      coding: [
        {
          system: "https://cognit.app/fhir/CodeSystem/self-report",
          code: "cbt-journal-summary",
          display: "CBT journal self-report summary",
        },
      ],
      text: "Cognit CBT journal self-report summary",
    },
    subject: {
      display: "User (Self-reported)",
    },
    effectiveDateTime: new Date().toISOString(),
    issued: new Date().toISOString(),
    performer: [
      {
        display: "Cognit λ Application",
      },
    ],
    valueString: t('fhir_latest_entry_value', { date: latestEntry.date }),
    note: [
      {
        text: "Cognit exports self-reported journaling data for portability. This Observation is not a diagnosis, treatment order, medical-device output, or clinical record replacement.",
      },
    ],
    ...(interpretation ? { interpretation } : {}),
    component,
  };
};


    
