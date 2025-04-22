// Color system for HydraCare app - Zen & Serenity

// Base colors - Pastel and soothing
const tintColorLight = '#A8D5E2'; // Soft aqua
const tintColorDark = '#C2E0F4'; // Light sky blue

// Color palette
export default {
  light: {
    primary: {
      50: '#F8FCFE', // Almost white blue
      100: '#EEF7FB', // Very pale blue
      200: '#E0F0F8', // Soft morning sky
      300: '#C2E0F4', // Light aqua
      400: '#A8D5E2', // Serene blue
      500: '#8CB9D0', // Main water blue - calming
      600: '#709DB8', // Deeper water
      700: '#5886A5', // Calm ocean
      800: '#406F92', // Deep calm
      900: '#2C5777', // Deep serenity
    },
    secondary: {
      50: '#F5FAF9', // Hint of mint
      100: '#EBF5F3', // Pale seafoam
      200: '#D8EBE7', // Soft sage
      300: '#BAD9D1', // Misty jade
      400: '#9BC7BB', // Sea glass
      500: '#7DB5A5', // Sage green
      600: '#649B8C', // Deep sage
      700: '#4F7E71', // Forest reflection
      800: '#3A6256', // Deep forest
      900: '#264539', // Forest night
    },
    accent: {
      50: '#FBF9F7', // Warm white
      100: '#F5F0EB', // Soft sand
      200: '#EFE7DF', // Pale peach
      300: '#E2D3C6', // Sand dune
      400: '#D5BFAD', // Warm sand
      500: '#C8AB94', // Adobe clay
      600: '#B08F74', // Terracotta
      700: '#957459', // Earth tone
      800: '#7A5A40', // Rich earth
      900: '#5F4027', // Deep earth
    },
    success: {
      50: '#F4FAF6', // Hint of green
      100: '#E5F4EB', // Very pale green
      200: '#CDE8D5', // Soft mint
      300: '#A8D4B3', // Spring green
      400: '#83C091', // Fresh green
      500: '#66AB79', // Growth green
      600: '#4F9664', // Forest green
      700: '#3B7A4E', // Deep forest
      800: '#295F39', // Pine green
      900: '#1A4327', // Dark pine
    },
    warning: {
      50: '#FDF9F3', // Soft yellow
      100: '#FBF3E7', // Morning light
      200: '#F6E5CB', // Sunshine
      300: '#F0D6A9', // Warm glow
      400: '#E8C282', // Golden hour
      500: '#DFAE61', // Sunset
      600: '#C9994D', // Rich gold
      700: '#AB803B', // Deep amber
      800: '#8D672B', // Bronze
      900: '#704E1C', // Dark bronze
    },
    error: {
      50: '#FCF4F4', // Blush
      100: '#F9E7E7', // Soft rose
      200: '#F3CECE', // Light coral
      300: '#E6A4A4', // Rose
      400: '#D87A7A', // Coral
      500: '#C45656', // Soft red
      600: '#A84444', // Deep rose
      700: '#8A3636', // Dark rose
      800: '#6D2929', // Wine
      900: '#501C1C', // Deep wine
    },
    neutral: {
      50: '#FAFBFC', // Cloud white
      100: '#F3F5F7', // Mist
      200: '#ECF0F3', // Soft gray
      300: '#DDE2E8', // Light pewter
      400: '#C5CCD6', // Silver
      500: '#A8B2BE', // Cool gray
      600: '#8D99A6', // Slate
      700: '#727E8C', // Storm
      800: '#5A6370', // Dark slate
      900: '#424952', // Charcoal
    },
    text: '#424952',
    background: '#FAFBFC',
    tint: tintColorLight,
    tabIconDefault: '#A8B2BE',
    tabIconSelected: tintColorLight,
    cardBackground: '#FFFFFF',
  },
  dark: {
    primary: {
      50: '#1A2B35', // Deep blue night
      100: '#243A47', // Ocean night
      200: '#2E4959', // Midnight blue
      300: '#385A6F', // Deep water
      400: '#436C86', // Night sea
      500: '#587E9C', // Evening water
      600: '#6E92B0', // Twilight blue
      700: '#8BA6C1', // Soft night blue
      800: '#A8BBD0', // Misty blue
      900: '#C2D1DE', // Pale night blue
    },
    secondary: {
      50: '#1B2826', // Deep forest night
      100: '#263836', // Dark sage
      200: '#324845', // Night forest
      300: '#425B56', // Deep moss
      400: '#536E67', // Night jade
      500: '#648178', // Evening sage
      600: '#7A9389', // Twilight green
      700: '#92A59B', // Soft sage
      800: '#ABB8AE', // Misty sage
      900: '#C4CBC2', // Pale sage
    },
    accent: {
      50: '#2A2521', // Deep earth
      100: '#3C352F', // Night soil
      200: '#4E443B', // Dark clay
      300: '#63544A', // Evening sand
      400: '#786559', // Dusk sand
      500: '#8E7668', // Twilight sand
      600: '#A38A79', // Warm evening
      700: '#B79E8C', // Soft dusk
      800: '#CAB2A0', // Pale dusk
      900: '#DBC7B6', // Moonlit sand
    },
    success: {
      50: '#1A2B21', // Deep forest
      100: '#253A2E', // Forest night
      200: '#30493B', // Dark emerald
      300: '#3D5B49', // Night pine
      400: '#4B6E58', // Forest shade
      500: '#5A8167', // Evening forest
      600: '#6F937A', // Twilight forest
      700: '#87A58F', // Soft forest
      800: '#A0B6A5', // Misty forest
      900: '#BAC7BC', // Pale forest
    },
    warning: {
      50: '#2A2520', // Deep amber
      100: '#3E362A', // Night amber
      200: '#524734', // Dark gold
      300: '#685940', // Evening gold
      400: '#7E6C4C', // Dusk gold
      500: '#937F59', // Twilight gold
      600: '#A7926C', // Warm evening
      700: '#BAA583', // Soft gold
      800: '#CCB89A', // Pale gold
      900: '#DDCBB3', // Moonlit gold
    },
    error: {
      50: '#2A1E1E', // Deep wine
      100: '#3C2A2A', // Night rose
      200: '#4E3636', // Dark rose
      300: '#634444', // Evening rose
      400: '#785252', // Dusk rose
      500: '#8D6161', // Twilight rose
      600: '#A17474', // Warm rose
      700: '#B48989', // Soft rose
      800: '#C69F9F', // Pale rose
      900: '#D7B6B6', // Moonlit rose
    },
    neutral: {
      50: '#1A1C1E', // Ink black
      100: '#24272A', // Night
      200: '#2F3337', // Charcoal
      300: '#3D4247', // Deep slate
      400: '#4C5258', // Slate
      500: '#5E656C', // Evening gray
      600: '#737A82', // Twilight gray
      700: '#8B9198', // Soft gray
      800: '#A4A9B0', // Misty gray
      900: '#BEC1C7', // Pale gray
    },
    text: '#E8EAED',
    background: '#1A1C1E',
    tint: tintColorDark,
    tabIconDefault: '#5E656C',
    tabIconSelected: tintColorDark,
    cardBackground: '#24272A',
  },
};
