import { StyleSheet, Dimensions, Platform } from 'react-native';

// Get screen dimensions for responsive sizing
const { width } = Dimensions.get('window');
const isSmallDevice = width < 375;

// Enhanced color palette with better semantic naming
const COLORS = {
  // Primary colors
  primary: '#2D6A4F',          // Main brand color
  primaryLight: '#74C69D',     // Lighter variant
  primaryDark: '#1B4332',      // Darker variant for press states
  
  // Background colors
  background: '#F7F9FC',       // Lighter background for better contrast
  surface: '#FFFFFF',          // Card/surface color
  
  // Text colors with better contrast
  textPrimary: '#1A1A2E',      // Near-black for primary text
  textSecondary: '#4A4A68',    // Dark gray for secondary text
  textLight: '#FFFFFF',        // White text for dark backgrounds
  
  // Status and feedback colors
  success: '#52B788',          // Success state
  error: '#E63946',            // Error state  
  warning: '#F9C74F',          // Warning state
  info: '#4CC9F0',             // Information state
  
  // UI element colors
  border: '#E0E6ED',           // Subtle border color
  divider: '#EAECF0',          // Even more subtle divider
  disabled: '#CCD3DD',         // Disabled state
  
  // Interaction states
  ripple: 'rgba(45, 106, 79, 0.12)', // Touch feedback
};

// Shadow generators for different platforms
const generateShadow = (elevation = 2) => {
  return Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: elevation },
      shadowOpacity: 0.1 + (elevation * 0.03),
      shadowRadius: elevation * 0.8,
    },
    android: {
      elevation: elevation,
    },
  });
};

export const styles = StyleSheet.create({
  // Main container with improved background
  mainContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  
  // Loading container with centered indicator
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  
  // Enhanced card design with better shadows and subtle border
  card: {
    width: '100%',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...generateShadow(3),
  },
  
  // Improved card title with better typography
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  
  // Row layout with better spacing
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  
  // Last row without margin
  rowLast: {
    marginBottom: 0,
  },
  
  // Icon styling with consistent spacing
  icon: {
    marginRight: 12,
    width: 18,
    textAlign: 'center',
  },
  
  // Card text with improved readability
  cardText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    flex: 1,
    lineHeight: 20,
  },
  
  cardTextLabel: {
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginRight: 4,
  },
  
  // Status indicator for active/inactive users
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  
  statusActive: {
    backgroundColor: COLORS.success,
  },
  
  statusInactive: {
    backgroundColor: COLORS.error,
  },
  
  statusText: {
    fontSize: 13,
    fontWeight: '600',
  },
  
  statusTextActive: {
    color: COLORS.success,
  },
  
  statusTextInactive: {
    color: COLORS.error,
  },
  
  // Action buttons container
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
  },
  
  // Edit button with improved interaction design
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    ...generateShadow(2),
  },
  
  // New user floating action button
  newButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    position: 'absolute',
    bottom: 24,
    right: 24,
    ...generateShadow(4),
  },
  
  // Disabled state for buttons
  buttonDisabled: {
    backgroundColor: COLORS.disabled,
  },
  
  // Button icon with better alignment
  buttonIcon: {
    marginRight: 8,
  },
  
  // Button text with improved typography
  buttonText: {
    color: COLORS.textLight,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.25,
  },
  
  // Error message styling
  errorText: {
    fontSize: 15,
    color: COLORS.error,
    textAlign: 'center',
    marginVertical: 12,
  },
  
  // Empty state container
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  
  emptyIcon: {
    marginBottom: 16,
    opacity: 0.7,
  },
  
  emptyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  
  // Input styles for forms
  input: {
    width: '100%',
    height: 55,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 20,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  
  inputFocused: {
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  
  inputError: {
    borderColor: COLORS.error,
  },
  
  inputLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 8,
    fontWeight: '500',
  },
  
  // Button row with improved spacing
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 8,
  },
  
  // Save button with clear action emphasis
  saveButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    ...generateShadow(2),
  },
  
  // Cancel button with less emphasis
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Styles for filter section if needed
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  
  filterButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  
  filterButtonText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
  
  filterButtonTextActive: {
    color: COLORS.textLight,
  },
});

// Export the colors for use in other files if needed
export { COLORS, generateShadow };