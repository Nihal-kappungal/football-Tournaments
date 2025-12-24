const tintColorLight = '#2f95dc';
const tintColorDark = '#FFD700'; // Gold for premium feel

export const Colors = {
    light: {
        text: '#000',
        background: '#fff',
        tint: tintColorLight,
        tabIconDefault: '#ccc',
        tabIconSelected: tintColorLight,
    },
    dark: {
        text: '#ECEDEE', // Soft white
        background: '#121212', // Deep black/gray
        surface: '#1E1E1E', // Card background
        primary: '#4CAF50', // Football grass green, vibrant
        accent: '#FFD700', // Gold/Trophy
        danger: '#FF453A',
        gray: '#8E8E93',
        tint: tintColorDark,
        tabIconDefault: '#ccc',
        tabIconSelected: tintColorDark,
        border: '#2C2C2C',
    },
};

export const Layout = {
    spacing: {
        xs: 4,
        sm: 8,
        md: 16,
        lg: 24,
        xl: 32,
    },
    borderRadius: {
        sm: 8,
        md: 12,
        lg: 16,
        xl: 24,
    },
};
