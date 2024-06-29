import hyprland from "./hyprland"
import lowBattery from "./battery"
import notifications from "./notifications"

export default function init() {
  try {
    lowBattery()
    notifications()
    hyprland()
    // Utils.exec("nm-applet");
    // at some point I may replace this with something else
  } catch (error) {
    logError(error)
  }
}
