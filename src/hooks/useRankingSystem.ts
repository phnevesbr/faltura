import { useSystemSettings } from './useSystemSettings';

interface RankingTitle {
  tier: string;
  min_level: number;
  max_level: number;
  title: string;
  color: string;
}

export const useRankingSystem = () => {
  const { getSetting } = useSystemSettings();

  const getRankingTitles = (): RankingTitle[] => {
    const setting = getSetting('ranking_titles');
    return setting?.titles || [];
  };

  const getMaxLevel = (): number => {
    const setting = getSetting('ranking_max_level');
    return setting?.value || 50;
  };

  const getTitleForLevel = (level: number): RankingTitle | null => {
    const titles = getRankingTitles();
    return titles.find(title => level >= title.min_level && level <= title.max_level) || null;
  };

  const getResetFrequency = () => {
    const setting = getSetting('ranking_reset_frequency');
    return {
      frequency: setting?.frequency || 'manual',
      autoResetDate: setting?.auto_reset_date,
      lastReset: setting?.last_reset,
      enabled: setting?.enabled || false
    };
  };

  const shouldLevelBeCapped = (currentLevel: number, newLevel: number): boolean => {
    const maxLevel = getMaxLevel();
    return newLevel > maxLevel;
  };

  const getCapLevel = (proposedLevel: number): number => {
    const maxLevel = getMaxLevel();
    return Math.min(proposedLevel, maxLevel);
  };

  const formatTitleDisplay = (level: number): { title: string; color: string; tier: string } => {
    const titleData = getTitleForLevel(level);
    return {
      title: titleData?.title || 'Sem Título',
      color: titleData?.color || '#6B7280',
      tier: titleData?.tier || 'unknown'
    };
  };

  return {
    getRankingTitles,
    getMaxLevel,
    getTitleForLevel,
    getResetFrequency,
    shouldLevelBeCapped,
    getCapLevel,
    formatTitleDisplay
  };
};

export default useRankingSystem;