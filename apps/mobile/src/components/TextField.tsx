import { useState } from "react";
import { View, Text, TextInput, Pressable, type TextInputProps } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface TextFieldProps extends TextInputProps {
  label: string;
  error?: string;
}

export function TextField({ label, error, secureTextEntry, ...props }: TextFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <View className="gap-2">
      <Text className="text-sm font-medium text-muted">{label}</Text>
      <View className="relative justify-center">
        <TextInput
          placeholderTextColor="#6B6B76"
          secureTextEntry={secureTextEntry && !visible}
          className={`rounded-2xl border border-border bg-surface-elevated px-4 py-3.5 text-base text-foreground ${
            secureTextEntry ? "pr-12" : ""
          }`}
          {...props}
        />
        {secureTextEntry ? (
          <Pressable
            onPress={() => setVisible((prev) => !prev)}
            className="absolute right-3 h-8 w-8 items-center justify-center"
          >
            <Ionicons name={visible ? "eye-off-outline" : "eye-outline"} size={20} color="#6B6B76" />
          </Pressable>
        ) : null}
      </View>
      {error ? <Text className="text-sm text-danger">{error}</Text> : null}
    </View>
  );
}
