import dayjs from 'dayjs';

/**
 * 格式化文件大小
 * @param size 文件大小（字节）
 * @returns 格式化后的文件大小字符串
 */
export const formatFileSize = (size: number | string): string => {
  if (typeof size === 'string') return size;

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let fileSize = size;
  let unitIndex = 0;

  while (fileSize >= 1024 && unitIndex < units.length - 1) {
    fileSize /= 1024;
    unitIndex++;
  }

  return `${fileSize.toFixed(2)} ${units[unitIndex]}`;
};

/**
 * 格式化最后修改时间
 * @param date 日期值（时间戳、字符串或 Date 对象）
 * @returns 格式化后的时间字符串 (MM-DD HH:mm:ss)
 */
export const formatLastModified = (date: string | number | Date): string => {
  const parsed = dayjs(date);

  if (!parsed.isValid()) {
    return typeof date === 'string' ? date : '-';
  }

  return parsed.format('MM-DD HH:mm:ss');
};
