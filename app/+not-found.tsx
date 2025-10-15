import { Link, Stack } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Not Found", headerShown: true }} />
      <View style={styles.container}>
        <Text style={styles.title}>This screen doesn&apos;t exist.</Text>
        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>Go to planner</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#0A0A0A",
  },
  title: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: "#FFF",
    marginBottom: 20,
  },
  link: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: "#4A9B9B",
    borderRadius: 10,
  },
  linkText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#FFF",
  },
});
