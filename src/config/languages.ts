import type { LanguageInfo, SupportedLanguage } from '@/types/cms';

// 支持的语言列表
export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  {
    code: 'zh-hans',
    label: '简体中文',
    shortLabel: '简'
  },
  {
    code: 'en',
    label: 'English',
    shortLabel: 'EN'
  },
  {
    code: 'zh-hant',
    label: '繁體中文',
    shortLabel: '繁'
  },
  {
    code: 'ja',
    label: '日本語',
    shortLabel: '日'
  },
  {
    code: 'ko',
    label: '한국어',
    shortLabel: '한'
  },
  {
    code: 'fr',
    label: 'Français',
    shortLabel: 'FR'
  }
];

// 默认语言
export const DEFAULT_LANGUAGE: SupportedLanguage = 'zh-hans';

// 获取语言信息
export function getLanguageInfo(code: SupportedLanguage): LanguageInfo | undefined {
  return SUPPORTED_LANGUAGES.find(lang => lang.code === code);
}

// 获取语言标签
export function getLanguageLabel(code: SupportedLanguage): string {
  return getLanguageInfo(code)?.label || code;
}

