import hyprland from "./hyprland"
import lowBattery from "./battery"
import notifications from "./notifications"

export default function init() {
  try {
    lowBattery()
    notifications()
    hyprland()
  } catch (error) {
    logError(error)
  }
}
