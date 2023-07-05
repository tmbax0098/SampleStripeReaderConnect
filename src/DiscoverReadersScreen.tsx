import * as React from 'react';
import {Platform} from 'react-native';
import {
  Alert,
  Button,
  Heading,
  Modal,
  Pressable,
  Spinner,
  Text,
  useToast,
  VStack,
} from 'native-base';
import {
  Reader,
  requestNeededAndroidPermissions,
  StripeError,
  UpdateSoftwareResultType,
  useStripeTerminal,
} from '@stripe/stripe-terminal-react-native';
import {
  PERMISSIONS,
  PermissionStatus,
  request,
  RESULTS,
} from 'react-native-permissions';
// @ts-ignore
import LocationServicesDialogBox from "react-native-android-location-services-dialog-box";

//sample project we set static lcation id
const locationReference: string = 'tmr_FKAhYgWyFhuojL';

type DetailOfConnectedReaderProps = {
  reader: Reader.Type;
  disconnect: () => any;
  update: () => any;
};

function DetailOfConnectedReader({
  reader,
  disconnect,
  update,
}: DetailOfConnectedReaderProps) {
  return (
    <VStack bg={'light.50'} p="2" space="1">
      <Heading>
        {reader.serialNumber.substring(reader.serialNumber.length - 3)}
      </Heading>
      <Text fontSize="xs">Serial Number : {reader.serialNumber}</Text>
      <Text fontSize="xs">ID : {reader.id}</Text>
      <Text fontSize="xs">Battery Level : {reader.batteryLevel}</Text>
      <Text fontSize="xs">Firmware Version : {reader.firmwareVersion}</Text>
      <Text fontSize="xs">Status : {reader.status}</Text>

      {reader.availableUpdate && (
        <Button size="lg" onPress={update} colorScheme="success">
          Update
        </Button>
      )}

      <Button size="lg" onPress={disconnect}>
        Disconnect
      </Button>
    </VStack>
  );
}

export default function DiscoverReadersScreen() {
  const toast = useToast();

  const [waitConnect, setWaitConnect] = React.useState(false);
  const [waitInitial, setWaitInitial] = React.useState<boolean>(false);
  const [waitDisconnect, setWaitDisconnect] = React.useState<boolean>(false);
  const [waitUpdate, setWaitUpdate] = React.useState<boolean>(false);
  const [updateProgress, setUpdateProgress] = React.useState<string>('');

  const [devices, setDevices] = React.useState<Reader.Type[]>([]);

  const {
    discoverReaders,
    connectedReader,
    disconnectReader,
    connectBluetoothReader,
    initialize,
    installAvailableUpdate,
    isInitialized,
    clearReaderDisplay,
    cancelDiscovering,
  } = useStripeTerminal({
    onUpdateDiscoveredReaders(readers: Reader.Type[]) {
      setDevices([...readers]);
    },
    onFinishDiscoveringReaders(error?: StripeError) {
      setWaitInitial(false);
    },
    onDidChangeConnectionStatus(status: Reader.ConnectionStatus) {
      switch (status) {
        case 'connecting':
          break;
        case 'connected':
          break;
        case 'notConnected':
          break;
      }
    },
    onDidReportAvailableUpdate(update: Reader.SoftwareUpdate) {
      setUpdateProgress('');
      installAvailableUpdate().then(() => null);
    },
    onDidStartInstallingUpdate(update: Reader.SoftwareUpdate) {
      setWaitUpdate(true);
    },
    onDidFinishInstallingUpdate(result: UpdateSoftwareResultType) {
      setWaitUpdate(false);
      setUpdateProgress('');
      toast.show({
        render: () => (
          <Alert ml={2} variant="left-accent" colorScheme="danger">
            <Text>
              {result.error ? result.error.message : 'Update completed'}
            </Text>
          </Alert>
        ),
        placement: 'bottom-left',
        duration: 5000,
      });
    },
    onDidReportReaderSoftwareUpdateProgress(progress: string) {
      setUpdateProgress(progress);
    },
    onDidReportUnexpectedReaderDisconnect(error?: StripeError) {
      if (error)
        toast.show({
          render: () => (
            <Alert ml={2} variant="left-accent" colorScheme="danger">
              <Text>{error?.message}</Text>
            </Alert>
          ),
          placement: 'bottom-left',
          duration: 5000,
        });
    },
  });

  const handleDiscoverReaders = async () => {
    setDevices([]);
    // The list of discovered readers is reported in the `didUpdateDiscoveredReaders` method_
    // within the `useStripeTerminal` hook.
    const {error} = await discoverReaders({
      discoveryMethod: 'bluetoothScan',
      // simulated: true
    });

    if (error) console.error(error);
  };

  const handleConnectBluetoothReader = async (selectedReader: Reader.Type) => {
    if (waitConnect) return;
    setWaitConnect(true);

    const {reader, error} = await connectBluetoothReader({
      reader: selectedReader,
      locationId: locationReference,
    });

    setWaitConnect(false);

    if (error) {
      console.error(error);
      toast.show({
        render: () => (
          <Alert ml={2} variant="left-accent" colorScheme="danger">
            <Text>{error.message}</Text>
          </Alert>
        ),
        placement: 'bottom-left',
        duration: 5000,
      });
      return;
    }

    await clearReaderDisplay();

    toast.show({
      render: () => (
        <Alert ml={2} variant="left-accent" colorScheme="success">
          <Text>Reader connected successfully.</Text>
        </Alert>
      ),
      placement: 'bottom-left',
      duration: 3000,
    });
    if (reader?.availableUpdate) installAvailableUpdate().then(() => null);
  }

  const configTerminal = async () => {
    toast.closeAll();

    if (Platform.OS === 'android') {
      const granted = await requestNeededAndroidPermissions({
        accessFineLocation: {
          title: 'Location Permission',
          message: 'Stripe Terminal needs access to your location',
          buttonPositive: 'Accept',
        },
      });
      if (granted) {
        LocationServicesDialogBox.checkLocationServicesIsEnabled({
          message:
            "<h2 style='color: #0af13e'>Use Location ?</h2>This app wants to change your device settings:<br/><br/>Use GPS, Wi-Fi, and cell network for location<br/><br/><a href='#'>Learn more</a>",
          ok: 'YES',
          cancel: 'NO',
          enableHighAccuracy: true, // true => GPS AND NETWORK PROVIDER, false => GPS OR NETWORK PROVIDER
          showDialog: true, // false => Opens the Location access page directly
          openLocationServices: true, // false => Directly catch method is called if location services are turned off
          preventOutSideTouch: false, // true => To prevent the location services window from closing when it is clicked outside
          preventBackClick: false, // true => To prevent the location services popup from closing when it is clicked back button
          providerListener: false, // true ==> Trigger locationProviderStatusChange listener when the location state changes
        })
          .then(function (success: {
            alreadyEnabled: boolean;
            enabled: boolean;
            status: string;
          }) {
            // console.log(success); // success => {alreadyEnabled: false, enabled: true, status: "enabled"}
            if (success.alreadyEnabled || success.enabled) {
              // Initialize the SDK
              afterGranted();
            }
          })
          .catch((error: any) => {
            console.error(error); // error.message => "disabled"
          });
      } else {
        console.error(
          'Location and BT services are required in order to connect to a reader.',
        );
      }
    } else if (Platform.OS == 'ios' && parseInt(Platform.Version, 10) > 12) {
      let result: PermissionStatus = await request(
        PERMISSIONS.IOS.BLUETOOTH_PERIPHERAL,
      );

      switch (result) {
        case RESULTS.UNAVAILABLE:
          console.log(
            'This feature is not available (on this device / in this context)',
          );
          break;
        case RESULTS.DENIED:
          console.log(
            'The permission has not been requested / is denied but requestable',
          );
          break;
        case RESULTS.LIMITED:
          console.log('The permission is limited: some actions are possible');
          await afterGranted();
          break;
        case RESULTS.GRANTED:
          console.log('The permission is granted');
          await afterGranted();
          break;
        case RESULTS.BLOCKED:
          console.log('The permission is denied and not requestable anymore');
          break;
      }
    } else {
      await afterGranted();
    }
  };

  const afterGranted = async () => {
    setWaitInitial(true);

    // if (!isInitialized)
    await initialize();

    if (isInitialized) {
      await handleDiscoverReaders();
      setWaitInitial(false);
    } else setWaitInitial(false);
  };

  const disconnect = async () => {
    try {
      setWaitDisconnect(true);
      await clearReaderDisplay();
      await disconnectReader();
    } catch (e) {}
    setWaitDisconnect(false);
  };

  const cancelDiscover = async () => {
    toast.closeAll();
    await cancelDiscovering();
    setWaitInitial(false);
  };

  React.useEffect(() => {
    toast.closeAll();
    configTerminal().then(() => null);
  }, []);

  return (
    <VStack>
      <Modal isOpen={waitUpdate} size="xs" closeOnOverlayClick={false}>
        <Modal.Content>
          <Modal.Body
            display="flex"
            justifyContent="center"
            alignItems="center">
            <Spinner size="lg" mb="4" />
            <Heading textAlign="center">Reader install update ...</Heading>
            <Text textAlign="center" mt="2" bold>
              {'progressing %' + updateProgress}
            </Text>
          </Modal.Body>
        </Modal.Content>
      </Modal>

      <Modal
        isOpen={waitInitial || waitConnect || waitDisconnect}
        size="xs"
        closeOnOverlayClick={false}>
        <Modal.Content>
          <Modal.Body
            display="flex"
            justifyContent="center"
            alignItems="center">
            <Spinner size="lg" mb="4" />
            <Text textAlign="center">
              {waitInitial
                ? 'Wait while initial and discover terminal device ...'
                : waitConnect
                ? 'Wait connect to reader'
                : 'Wait disconnect'}
            </Text>
            {waitInitial && (
              <Button mt="4" onPress={cancelDiscover}>
                Finish Search
              </Button>
            )}
          </Modal.Body>
        </Modal.Content>
      </Modal>

      {connectedReader || waitInitial ? null : (
        <Button m="2" size="lg" onPress={configTerminal}>
          Discover Readers
        </Button>
      )}

      {connectedReader ? (
        <DetailOfConnectedReader
          reader={connectedReader}
          disconnect={disconnect}
          update={installAvailableUpdate}
        />
      ) : (
        devices.map((item, index) => (
          <Pressable
            key={index}
            onPress={() => handleConnectBluetoothReader(item)}
            disabled={waitConnect}
            mx="2"
            mb="2">
            <VStack
              bg="light.100"
              p="2"
              borderWidth="1"
              borderColor="light.300"
              borderRadius="4">
              <Heading>
                {item.serialNumber.substring(item.serialNumber.length - 3)}
              </Heading>
              <Text fontSize="sm">Serial Number : {item.serialNumber}</Text>
              <Text fontSize="sm">ID : {item.id}</Text>
              <Text fontSize="sm">Battery Level : {item.batteryLevel}</Text>
              <Text fontSize="sm">Battery Status : {item.batteryStatus}</Text>
              <Text fontSize="sm">Status : {item.status}</Text>
              <Text fontSize="sm">
                Firmware Version : {item.firmwareVersion}
              </Text>
              <Text fontSize="sm">
                Hardware Version : {item.hardwareVersion}
              </Text>
              <Text fontSize="sm">Location Status : {item.locationStatus}</Text>
              <Text fontSize="sm">Device Type : {item.deviceType}</Text>
            </VStack>
          </Pressable>
        ))
      )}
    </VStack>
  );
}
