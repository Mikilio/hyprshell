import type Gtk from "gi://Gtk?version=3.0"
import { ProfileSelector, ProfileToggle } from "./widgets/PowerProfile"
import { Header } from "./widgets/Header"
import { Volume, Microphone, SinkSelector, SourceSelector, AppMixer } from "./widgets/Volume"
import { Brightness } from "./widgets/Brightness"
import { WifiToggle, WifiSelection } from "./widgets/Network"
import { VpnToggle, VpnConnections } from "./widgets/VPN"
import { BluetoothToggle, BluetoothDevices } from "./widgets/Bluetooth"
import { DND } from "./widgets/DND"
import { DarkModeToggle } from "./widgets/DarkMode"
import { MicMute } from "./widgets/MicMute"
import { Media } from "./widgets/Media"
import PopupWindow from "widget/PopupWindow"
import options from "options"

const { bar, quicksettings } = options
const media = (await Service.import("mpris")).bind("players")
const layout = Utils.derive([bar.position, quicksettings.position], (bar, qs) =>
  `${bar}-${qs}` as const,
)
const network = await Service.import("network")
const powerprof = await Service.import("powerprofiles")

type Switch = () => Gtk.Widget;

const Options = () => {
  let options: Array<[Switch, Switch] | [Switch]> = [];
  if (network.primary != "wired") {
    options.push([WifiToggle, WifiSelection]);
  }
  if (Utils.exec("which bluetoothctl", () => true, () => false)) {
    options.push([BluetoothToggle, BluetoothDevices]);
  }
  if (powerprof.active_profile) {
    options.push([ProfileToggle, ProfileSelector]);
  }
  if (network.vpn.connections.length > 0) {
    options.push([VpnToggle, VpnConnections]);
  }
  options.push([DarkModeToggle]);
  options.push([MicMute]);
  options.push([DND]);
  return options
}

const Row = (
  toggles: Array<Switch> = [],
  menus: Array<Switch> = [],
) => Widget.Box({
  vertical: true,
  children: [
    Widget.Box({
      homogeneous: true,
      class_name: "row horizontal",
      children: toggles.map(w => w()),
    }),
    ...menus.map(w => w()),
  ],
})

const Settings = (
  switches: Array<[Switch, Switch] | [Switch]> = [],
  width: number = 2,
) => {
  let rows: any = [];

  while (switches?.length) {
    let toggles: Array<Switch> = []
    let menus: Array<Switch> = []
    switches.splice(0, width).map(s => {
      toggles.push(s[0]);
      if (s[1]) {
        menus.push(s[1]);
      }
    })
    rows.push(Row(toggles, menus));
  }

  return Widget.Box({
    vertical: true,
    class_name: "quicksettings vertical",
    css: quicksettings.width.bind().as(w => `min-width: ${w}px;`),
    children: [
      Header(),
      Widget.Box({
        class_name: "sliders-box vertical",
        vertical: true,
        children: [
          Row(
            [Volume],
            [SinkSelector, AppMixer],
          ),
          Row(
            [Microphone],
            [SourceSelector],
          ),
          Brightness(),
        ],
      }),
      ...rows,
      Widget.Box({
        visible: media.as(l => l.length > 0),
        child: Media(),
      }),
    ],
  })
}

const QuickSettings = () => PopupWindow({
  name: "quicksettings",
  exclusivity: "exclusive",
  transition: bar.position.bind().as(pos => pos === "top" ? "slide_down" : "slide_up"),
  layout: layout.value,

  child: Settings(Options()),
})

export function setupQuickSettings() {
  App.addWindow(QuickSettings())
  layout.connect("changed", () => {
    App.removeWindow("quicksettings")
    App.addWindow(QuickSettings())
  })
}
