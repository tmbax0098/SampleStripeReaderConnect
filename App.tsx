

import React from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  useColorScheme,
} from 'react-native';

import {
  Colors
} from 'react-native/Libraries/NewAppScreen';
import { NativeBaseProvider } from "native-base";

import { StripeTerminalProvider } from "@stripe/stripe-terminal-react-native";
import DiscoverReadersScreen from './src/DiscoverReadersScreen';


const fetchTokenProvider = async () => {
  return "pst_live_YWNjdF8xOURkcGpIMTJWVWxNcnFMLHhSRUM3T0plNFVqa2Rib01RWFVxODBuYXJrYVl5RXQ_003LswTqLp"
};

function App(): JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';

  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
  };

  return (
    <NativeBaseProvider>
    <StripeTerminalProvider
      logLevel="verbose"
      tokenProvider={fetchTokenProvider}>
      <SafeAreaView style={backgroundStyle}>
        <StatusBar
          barStyle={isDarkMode ? 'light-content' : 'dark-content'}
          backgroundColor={backgroundStyle.backgroundColor}
        />
        <DiscoverReadersScreen />
      </SafeAreaView>

    </StripeTerminalProvider>
    </NativeBaseProvider>
  );
}

const styles = StyleSheet.create({
  sectionContainer: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
  },
  sectionDescription: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '400',
  },
  highlight: {
    fontWeight: '700',
  },
});

export default App;
