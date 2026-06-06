import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet } from "react-native";
import { useAuthStore } from "@/stores/authStore";
import { ApiError } from "@/services/DataService";
import i18n from "@/locale/i18n";
import { useLocaleStore } from "@/stores/localeStore";

export default function LoginScreen() {
  useLocaleStore((s) => s.locale); // re-render when locale resolves
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((s) => s.login);

  const handleLogin = async () => {
    if (!username || !password) {
      setError(i18n.t("auth.loginError.empty"));
      return;
    }
    setLoading(true);
    setError("");
    try {
      await login(username, password);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) setError(i18n.t("auth.loginError.invalid"));
      else setError(i18n.t("auth.loginError.generic"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>SeaCube ERP</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <TextInput
        style={styles.input}
        placeholder={i18n.t("auth.username")}
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder={i18n.t("auth.password")}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>{i18n.t("auth.loginButton")}</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 32, backgroundColor: "#F4F5F7" },
  title: { fontSize: 28, fontWeight: "700", color: "#1A73E8", marginBottom: 32 },
  error: { color: "#991B1B", marginBottom: 12 },
  input: {
    width: "100%",
    maxWidth: 360,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    backgroundColor: "#fff",
    fontSize: 16,
  },
  button: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#1A73E8",
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
});
