import { Theme } from '../theme/themes';
import { Priority } from '../store/types';

export const PRIORITY_LABEL: Record<Priority, string> = {
  urgent: 'Urgente',
  high: 'Alta',
  medium: 'Média',
  low: 'Baixa',
};

export const PRIORITY_ORDER: Priority[] = ['urgent', 'high', 'medium', 'low'];

export function priorityColor(theme: Theme, p: Priority): string {
  switch (p) {
    case 'urgent':
      return theme.priorityUrgent;
    case 'high':
      return theme.priorityHigh;
    case 'medium':
      return theme.priorityMedium;
    case 'low':
      return theme.priorityLow;
  }
}
