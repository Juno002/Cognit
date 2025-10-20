
import React from 'react';
import type { ThoughtEntry } from '@/types';
import type { JournalStats } from '@/hooks/use-cbt-journal';
import type { TFunction } from '@/hooks/use-translation';
import { calculateICC, escapeHtml } from '@/lib/utils';

interface PrintReportProps {
  entries: ThoughtEntry[];
  stats: JournalStats;
  t: TFunction;
}

const PrintReport: React.FC<PrintReportProps> = ({ entries, stats, t }) => {
  return (
    <div id="print-content" className="p-4 bg-white text-black">
      <div className="flex items-center gap-3 border-b pb-4 mb-4">
        <span className="text-3xl text-blue-600" role="img" aria-label="Lambda">λ</span>
        <div>
          <h1 className="text-2xl font-bold">Cognit λ - {t('report_title')}</h1>
          <p className="text-sm text-gray-500">{t('header_tagline')}</p>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">{t('report_summary_title')}</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-100 p-3 rounded-lg">
            <h3 className="font-bold text-gray-600">{t('report_total_sessions')}</h3>
            <p className="text-2xl">{stats.total}</p>
          </div>
          <div className="bg-gray-100 p-3 rounded-lg">
            <h3 className="font-bold text-gray-600">{t('report_l3_sessions')}</h3>
            <p className="text-2xl">{stats.totalL3}</p>
          </div>
          <div className="bg-gray-100 p-3 rounded-lg">
            <h3 className="font-bold text-gray-600">{t('report_avg_intensity')}</h3>
            <p className="text-2xl">{stats.avgIntensity}/10</p>
          </div>
          {stats.avgICC && (
            <div className="bg-gray-100 p-3 rounded-lg">
              <h3 className="font-bold text-gray-600">{t('report_avg_icc_title')}</h3>
              <p className="text-2xl">{stats.avgICC}</p>
            </div>
          )}
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">{t('report_latest_entries_title')}</h2>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr>
              <th className="border-b-2 p-2">{t('report_table_date')}</th>
              <th className="border-b-2 p-2">{t('report_table_level')}</th>
              <th className="border-b-2 p-2">{t('report_table_emotion_intensity')}</th>
              <th className="border-b-2 p-2">{t('report_table_icc')}</th>
              <th className="border-b-2 p-2">{t('report_table_trigger')}</th>
              <th className="border-b-2 p-2">{t('report_table_auto_thought')}</th>
            </tr>
          </thead>
          <tbody>
            {entries.map(r => {
              const iccValue = calculateICC(r.originalIntensity, r.finalCredibility) ?? '—';
              return (
                <tr key={r.id} className="border-b">
                  <td className="p-2 text-sm">{r.date}</td>
                  <td className="p-2 text-sm">L{r.level}</td>
                  <td className="p-2 text-sm">{escapeHtml(r.emotion)} ({r.intensity}/10)</td>
                  <td className="p-2 text-sm font-bold">{iccValue}</td>
                  <td className="p-2 text-xs">{escapeHtml(r.situation)}</td>
                  <td className="p-2 text-xs">{escapeHtml(r.automaticThought)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <footer className="text-center text-xs text-gray-400 mt-8">
        <p>{t('report_footer')}</p>
        <p>{t('report_generation_date')}: {new Date().toLocaleString(t('locale'))}</p>
      </footer>
    </div>
  );
};

export default PrintReport;
