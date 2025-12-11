/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import KLineScreen from './screens/KLineScreen';

AppRegistry.registerComponent(appName, () => KLineScreen);
