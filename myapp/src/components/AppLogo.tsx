import React from 'react';
import {
  Image,
  ImageStyle,
  StyleProp,
  StyleSheet,
  DimensionValue,
  useWindowDimensions,
} from 'react-native';
import { LOGO_SOURCE } from '../constants/branding';

type AppLogoProps = {
  /** Sets equal width and height. Ignored when `width` is provided. */
  size?: number;
  width?: DimensionValue;
  height?: DimensionValue;
  style?: StyleProp<ImageStyle>;
};

export default function AppLogo({ size, width, height, style }: AppLogoProps) {
  const { width: screenWidth } = useWindowDimensions();
  const resolvedWidth = width ?? size ?? 48;
  const resolvedHeight =
    height ??
    (typeof resolvedWidth === 'number' ? resolvedWidth : screenWidth * 0.5);

  return (
    <Image
      source={LOGO_SOURCE}
      style={[styles.logo, { width: resolvedWidth, height: resolvedHeight }, style]}
      accessibilityLabel="Haya Shield logo"
    />
  );
}

const styles = StyleSheet.create({
  logo: {
    resizeMode: 'contain',
  },
});
