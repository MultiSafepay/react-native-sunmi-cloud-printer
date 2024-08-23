import { FC, PropsWithChildren, useMemo } from "react";
import {
  Platform,
  Pressable,
  PressableProps,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from "react-native";

interface Props extends PressableProps {
  style?: ViewStyle;
  opacity?: number;
  activeBackground?: string;
}

const MyPressable: FC<PropsWithChildren<Props>> = ({
  disabled,
  style,
  onPress,
  children,
  opacity,
  activeBackground,
}) => {
  const activeStyleMemo: StyleProp<ViewStyle> = useMemo(() => {
    if (activeBackground) {
      // add transparency to match android's android_ripple color
      return Platform.OS === "ios"
        ? { backgroundColor: `${activeBackground}99` }
        : {};
    }
    return { opacity: opacity ?? 0.4 };
  }, [opacity, activeBackground]);

  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      android_ripple={
        activeBackground ? { color: activeBackground } : undefined
      }
      style={({ pressed }) => [
        styles.base,
        { opacity: disabled ? 0.3 : 1 },
        style,
        pressed && activeStyleMemo,
      ]}
    >
      {children}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    padding: 10,
    borderRadius: 5,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default MyPressable;
