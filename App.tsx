import React from 'react';
import {SafeAreaView, StatusBar, useColorScheme} from 'react-native';

import {Colors} from 'react-native/Libraries/NewAppScreen';
import {NativeBaseProvider} from 'native-base';

import {StripeTerminalProvider} from '@stripe/stripe-terminal-react-native';
import DiscoverReadersScreen from './src/DiscoverReadersScreen';

const fetchTokenProvider = async () => {
  return 'pst_live_YWNjdF8xOURkcGpIMTJWVWxNcnFMLG9jZUdPT3ZiTTlLZ0J6VTRRZmllQW91OE1HOVZaNHQ_00PSOnGFlv';
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

export default App;
