import { FC, PropsWithChildren } from "react";
import { Text, View } from "react-native";
import Pressable from "./pressable";

interface Props {
  backgroundColor?: string;
  selected?: boolean;
  disabled?: boolean;
  title: string;
  textColor?: string;
  onPress: () => void;
}

const InterfaceButton: FC<Props> = ({
  backgroundColor,
  disabled,
  onPress,
  selected,
  title,
  textColor,
}) => {
  return (
    <Pressable
      disabled={disabled}
      style={{ backgroundColor }}
      onPress={onPress}
    >
      <View
        style={{
          borderColor: selected ? "#581845" : undefined,
          borderWidth: selected ? 1 : 0,
          borderRadius: 5,
        }}
      >
        <Text
          style={{
            fontWeight: "bold",
            paddingVertical: 10,
            paddingHorizontal: 15,
            color: textColor,
          }}
        >
          {title}
        </Text>
      </View>
    </Pressable>
  );
};
export default InterfaceButton;
