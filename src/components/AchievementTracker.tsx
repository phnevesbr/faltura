
import React from 'react';
import { useAchievements } from '../contexts/AchievementsContext';
import { useEffect } from 'react';

const AchievementTracker = () => {
  const { trackColorChange, trackFileDownload } = useAchievements();

  useEffect(() => {
    let isImporting = false;

    // Listen for import start/end events
    const handleImportStart = () => {
      isImporting = true;
    };

    const handleImportEnd = () => {
      setTimeout(() => {
        isImporting = false;
      }, 2000); // Aguarda 2 segundos após importação antes de permitir tracking
    };

    // Listen for color change events
    const handleColorChange = (event: CustomEvent) => {
      if (!isImporting) {
        trackColorChange(event.detail.subjectId, event.detail.color);
      }
    };

    // Listen for file download events
    const handleFileDownload = () => {
      trackFileDownload();
    };

    window.addEventListener('importStart', handleImportStart);
    window.addEventListener('importEnd', handleImportEnd);
    window.addEventListener('colorChanged', handleColorChange as EventListener);
    window.addEventListener('fileDownloaded', handleFileDownload);

    return () => {
      window.removeEventListener('importStart', handleImportStart);
      window.removeEventListener('importEnd', handleImportEnd);
      window.removeEventListener('colorChanged', handleColorChange as EventListener);
      window.removeEventListener('fileDownloaded', handleFileDownload);
    };
  }, [trackColorChange, trackFileDownload]);

  return null;
};

export default AchievementTracker;
