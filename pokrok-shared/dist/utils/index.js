"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIconEmoji = exports.getIconComponent = exports.validateValueData = exports.validateStepData = exports.validateGoalData = exports.calculateGoalProgress = exports.getEventTypeText = exports.getStepPriorityText = exports.getStepPriorityColor = exports.getValueExperienceToNextLevel = exports.getValueLevelText = exports.getGoalCategoryText = exports.getGoalPriorityText = exports.getGoalStatusText = exports.getGoalProgressColor = exports.isFuture = exports.isPast = exports.isToday = exports.formatDateShort = exports.formatDate = void 0;
// Date utilities
const formatDate = (date) => {
    const d = new Date(date);
    return d.toLocaleDateString('cs-CZ', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
};
exports.formatDate = formatDate;
const formatDateShort = (date) => {
    const d = new Date(date);
    return d.toLocaleDateString('cs-CZ', {
        month: 'short',
        day: 'numeric',
    });
};
exports.formatDateShort = formatDateShort;
const isToday = (date) => {
    const today = new Date();
    const targetDate = new Date(date);
    return today.toDateString() === targetDate.toDateString();
};
exports.isToday = isToday;
const isPast = (date) => {
    const today = new Date();
    const targetDate = new Date(date);
    return targetDate < today;
};
exports.isPast = isPast;
const isFuture = (date) => {
    const today = new Date();
    const targetDate = new Date(date);
    return targetDate > today;
};
exports.isFuture = isFuture;
// Goal utilities
const getGoalProgressColor = (progress) => {
    if (progress >= 80)
        return '#10B981'; // green
    if (progress >= 60)
        return '#F59E0B'; // yellow
    if (progress >= 40)
        return '#F97316'; // orange
    return '#EF4444'; // red
};
exports.getGoalProgressColor = getGoalProgressColor;
const getGoalStatusText = (status) => {
    const statusMap = {
        active: 'Aktivní',
        completed: 'Dokončeno',
        paused: 'Pozastaveno',
        cancelled: 'Zrušeno',
    };
    return statusMap[status] || status;
};
exports.getGoalStatusText = getGoalStatusText;
const getGoalPriorityText = (priority) => {
    const priorityMap = {
        meaningful: 'Smysluplné',
        'nice-to-have': 'Příjemné mít',
    };
    return priorityMap[priority] || priority;
};
exports.getGoalPriorityText = getGoalPriorityText;
const getGoalCategoryText = (category) => {
    const categoryMap = {
        'short-term': 'Krátkodobé',
        'medium-term': 'Střednědobé',
        'long-term': 'Dlouhodobé',
    };
    return categoryMap[category] || category;
};
exports.getGoalCategoryText = getGoalCategoryText;
// Value utilities
const getValueLevelText = (level) => {
    const levelMap = {
        1: 'Začátečník',
        2: 'Pokročilý',
        3: 'Zkušený',
        4: 'Expert',
        5: 'Mistr',
    };
    return levelMap[level] || `Úroveň ${level}`;
};
exports.getValueLevelText = getValueLevelText;
const getValueExperienceToNextLevel = (experience) => {
    const thresholds = [0, 250, 500, 750, 1000];
    const currentLevel = Math.floor(experience / 250) + 1;
    const nextThreshold = thresholds[Math.min(currentLevel, 4)];
    return Math.max(0, nextThreshold - experience);
};
exports.getValueExperienceToNextLevel = getValueExperienceToNextLevel;
// Step utilities
const getStepPriorityColor = (isImportant, isUrgent) => {
    if (isImportant && isUrgent)
        return '#EF4444'; // red
    if (isImportant)
        return '#F59E0B'; // yellow
    if (isUrgent)
        return '#F97316'; // orange
    return '#6B7280'; // gray
};
exports.getStepPriorityColor = getStepPriorityColor;
const getStepPriorityText = (isImportant, isUrgent) => {
    if (isImportant && isUrgent)
        return 'Důležité a naléhavé';
    if (isImportant)
        return 'Důležité';
    if (isUrgent)
        return 'Naléhavé';
    return 'Normální';
};
exports.getStepPriorityText = getStepPriorityText;
// Event utilities
const getEventTypeText = (eventType) => {
    const typeMap = {
        metric_update: 'Aktualizace metriky',
        step_reminder: 'Připomínka kroku',
    };
    return typeMap[eventType] || eventType;
};
exports.getEventTypeText = getEventTypeText;
// Progress calculation utilities
const calculateGoalProgress = (goal, steps) => {
    if (goal.progress_type === 'steps') {
        const goalSteps = steps.filter(step => step.goal_id === goal.id);
        if (goalSteps.length === 0)
            return 0;
        const completedSteps = goalSteps.filter(step => step.completed).length;
        return Math.round((completedSteps / goalSteps.length) * 100);
    }
    if (goal.progress_type === 'count' && goal.progress_target) {
        return Math.round(((goal.progress_current || 0) / goal.progress_target) * 100);
    }
    if (goal.progress_type === 'amount' && goal.progress_target) {
        return Math.round(((goal.progress_current || 0) / goal.progress_target) * 100);
    }
    return goal.progress_percentage;
};
exports.calculateGoalProgress = calculateGoalProgress;
// Validation utilities
const validateGoalData = (goalData) => {
    const errors = [];
    if (!goalData.title?.trim()) {
        errors.push('Název cíle je povinný');
    }
    if (goalData.title && goalData.title.length > 255) {
        errors.push('Název cíle je příliš dlouhý (max 255 znaků)');
    }
    if (goalData.description && goalData.description.length > 1000) {
        errors.push('Popis cíle je příliš dlouhý (max 1000 znaků)');
    }
    if (goalData.target_date) {
        const targetDate = new Date(goalData.target_date);
        if (isNaN(targetDate.getTime())) {
            errors.push('Neplatné datum cíle');
        }
    }
    if (goalData.progress_target !== undefined && goalData.progress_target < 0) {
        errors.push('Cílová hodnota nemůže být záporná');
    }
    if (goalData.progress_current !== undefined && goalData.progress_current < 0) {
        errors.push('Aktuální hodnota nemůže být záporná');
    }
    return errors;
};
exports.validateGoalData = validateGoalData;
const validateStepData = (stepData) => {
    const errors = [];
    if (!stepData.title?.trim()) {
        errors.push('Název kroku je povinný');
    }
    if (stepData.title && stepData.title.length > 255) {
        errors.push('Název kroku je příliš dlouhý (max 255 znaků)');
    }
    if (stepData.description && stepData.description.length > 1000) {
        errors.push('Popis kroku je příliš dlouhý (max 1000 znaků)');
    }
    if (!stepData.date) {
        errors.push('Datum kroku je povinné');
    }
    return errors;
};
exports.validateStepData = validateStepData;
const validateValueData = (valueData) => {
    const errors = [];
    if (!valueData.name?.trim()) {
        errors.push('Název hodnoty je povinný');
    }
    if (valueData.name && valueData.name.length > 255) {
        errors.push('Název hodnoty je příliš dlouhý (max 255 znaků)');
    }
    if (valueData.description && valueData.description.length > 1000) {
        errors.push('Popis hodnoty je příliš dlouhý (max 1000 znaků)');
    }
    if (!valueData.color || !/^#[0-9A-F]{6}$/i.test(valueData.color)) {
        errors.push('Neplatná barva (musí být ve formátu #RRGGBB)');
    }
    if (!valueData.icon?.trim()) {
        errors.push('Ikona je povinná');
    }
    return errors;
};
exports.validateValueData = validateValueData;
// Icon utilities
const getIconComponent = (iconName) => {
    // This would be implemented based on your icon library
    // For now, return a placeholder
    return iconName;
};
exports.getIconComponent = getIconComponent;
const getIconEmoji = (iconName) => {
    const iconMap = {
        compass: '🧭',
        heart: '❤️',
        palette: '🎨',
        'trending-up': '📈',
        'heart-pulse': '💓',
        briefcase: '💼',
        map: '🗺️',
        moon: '🌙',
        star: '⭐',
        target: '🎯',
        users: '👥',
        'message-circle': '💬',
        lightbulb: '💡',
        flag: '🚩',
        zap: '⚡',
    };
    return iconMap[iconName] || '⭐';
};
exports.getIconEmoji = getIconEmoji;
//# sourceMappingURL=index.js.map