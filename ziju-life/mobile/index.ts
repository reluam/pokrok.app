import { registerWidgetTaskHandler } from "react-native-android-widget";
import { widgetTaskHandler } from "./widgets/androidWidgetHandler";

registerWidgetTaskHandler(widgetTaskHandler);

import "expo-router/entry";
