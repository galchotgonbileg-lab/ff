import { StatusBar } from "expo-status-bar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./src/context/AuthContext";
import { RootNavigator } from "./src/navigation/RootNavigator";
import { WebFrame } from "./src/components/WebFrame";

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <WebFrame>
          <RootNavigator />
        </WebFrame>
        <StatusBar style="light" />
      </AuthProvider>
    </QueryClientProvider>
  );
}
