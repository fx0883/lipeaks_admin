/**
 * 日期工具函数
 */

/**
 * 格式化日期
 * @param date 日期字符串、Date对象或时间戳
 * @param format 格式字符串，默认为 'YYYY-MM-DD HH:mm:ss'
 * @returns 格式化后的日期字符串
 */
export function formatDate(
  date: string | Date | number | null | undefined,
  format: string = 'YYYY-MM-DD HH:mm:ss'
): string {
  if (!date) return '-'

  let dateObj: Date
  
  if (typeof date === 'string') {
    dateObj = new Date(date)
  } else if (typeof date === 'number') {
    dateObj = new Date(date)
  } else if (date instanceof Date) {
    dateObj = date
  } else {
    return '-'
  }

  // 检查日期是否有效
  if (isNaN(dateObj.getTime())) {
    return '-'
  }

  const year = dateObj.getFullYear()
  const month = String(dateObj.getMonth() + 1).padStart(2, '0')
  const day = String(dateObj.getDate()).padStart(2, '0')
  const hours = String(dateObj.getHours()).padStart(2, '0')
  const minutes = String(dateObj.getMinutes()).padStart(2, '0')
  const seconds = String(dateObj.getSeconds()).padStart(2, '0')

  return format
    .replace('YYYY', String(year))
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds)
}

/**
 * 格式化日期为相对时间
 * @param date 日期字符串、Date对象或时间戳
 * @returns 相对时间字符串，如：刚刚、5分钟前、2小时前等
 */
export function formatRelativeTime(
  date: string | Date | number | null | undefined
): string {
  if (!date) return '-'

  let dateObj: Date
  
  if (typeof date === 'string') {
    dateObj = new Date(date)
  } else if (typeof date === 'number') {
    dateObj = new Date(date)
  } else if (date instanceof Date) {
    dateObj = date
  } else {
    return '-'
  }

  if (isNaN(dateObj.getTime())) {
    return '-'
  }

  const now = new Date()
  const diff = now.getTime() - dateObj.getTime()
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (seconds < 60) {
    return '刚刚'
  } else if (minutes < 60) {
    return `${minutes}分钟前`
  } else if (hours < 24) {
    return `${hours}小时前`
  } else if (days < 30) {
    return `${days}天前`
  } else {
    return formatDate(dateObj, 'YYYY-MM-DD')
  }
}

/**
 * 检查日期是否过期
 * @param date 日期字符串、Date对象或时间戳
 * @returns 是否过期
 */
export function isExpired(date: string | Date | number | null | undefined): boolean {
  if (!date) return false

  let dateObj: Date
  
  if (typeof date === 'string') {
    dateObj = new Date(date)
  } else if (typeof date === 'number') {
    dateObj = new Date(date)
  } else if (date instanceof Date) {
    dateObj = date
  } else {
    return false
  }

  if (isNaN(dateObj.getTime())) {
    return false
  }

  return dateObj.getTime() < Date.now()
}

/**
 * 计算两个日期之间的天数差
 * @param startDate 开始日期
 * @param endDate 结束日期
 * @returns 天数差
 */
export function daysBetween(
  startDate: string | Date | number,
  endDate: string | Date | number
): number {
  const start = new Date(startDate)
  const end = new Date(endDate)
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return 0
  }

  const diffTime = Math.abs(end.getTime() - start.getTime())
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

/**
 * 获取剩余天数
 * @param date 目标日期
 * @returns 剩余天数，负数表示已过期
 */
export function getRemainingDays(date: string | Date | number | null | undefined): number {
  if (!date) return 0

  let dateObj: Date
  
  if (typeof date === 'string') {
    dateObj = new Date(date)
  } else if (typeof date === 'number') {
    dateObj = new Date(date)
  } else if (date instanceof Date) {
    dateObj = date
  } else {
    return 0
  }

  if (isNaN(dateObj.getTime())) {
    return 0
  }

  const now = new Date()
  const diffTime = dateObj.getTime() - now.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

/**
 * 格式化持续时间
 * @param seconds 秒数
 * @returns 格式化的持续时间字符串
 */
export function formatDuration(seconds: number): string {
  if (!seconds || seconds < 0) return '0秒'

  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = seconds % 60

  const parts: string[] = []
  
  if (days > 0) parts.push(`${days}天`)
  if (hours > 0) parts.push(`${hours}小时`)
  if (minutes > 0) parts.push(`${minutes}分钟`)
  if (remainingSeconds > 0 || parts.length === 0) parts.push(`${remainingSeconds}秒`)

  return parts.join('')
}

/**
 * 获取时间范围描述
 * @param startDate 开始时间
 * @param endDate 结束时间
 * @returns 时间范围描述
 */
export function getTimeRangeDescription(
  startDate: string | Date | number,
  endDate: string | Date | number
): string {
  const start = formatDate(startDate, 'YYYY-MM-DD')
  const end = formatDate(endDate, 'YYYY-MM-DD')
  
  if (start === '-' || end === '-') return '-'
  if (start === end) return start
  
  return `${start} 至 ${end}`
}
