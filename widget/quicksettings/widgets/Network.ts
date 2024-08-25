import { Menu, ArrowToggleButton } from "../ToggleButton"
import icons from "lib/icons.js"
import { dependencies, sh } from "lib/utils"
import options from "options"
const { wifi, vpn } = await Service.import("network")
import { type VpnConnection } from "types/service/network"

export const VpnToggle = () => ArrowToggleButton({
  name: "vpn",
  icon: "network-vpn",
  label: Utils.watch("Disconnected", vpn, () => {
    if (vpn.activated_connections.length === 0)
      return "Disconnected"

    if (vpn.activated_connections.length === 1)
      return vpn.activated_connections[0].id

    return `${vpn.activated_connections.length} Connected`
  }),
  connection: [vpn, () => vpn.activated_connections.length !== 0],
  deactivate: () => {
    for (var connection of vpn.activated_connections) {
      connection.setConnection(false);
    }
  },
  activate: () => vpn.conncteions[0].setConnection(true),
})

const VpnItem = (conn: VpnConnection) => Widget.Box({
  children: [
    Widget.Icon(Utils.lookUpIcon(conn.icon_name) ? conn.icon_name + "-symbolic" : "network-vpn"),
    Widget.Label(conn.id),
    Widget.Box({ hexpand: true }),
    Widget.Spinner({
      active: conn.bind("state").as((s: string) => s === "connecting"),
      visible: conn.bind("state").as((s: string) => s === "connecting"),
    }),
    Widget.Switch({
      active: conn.bind("state").as((s: string) => s === "connected"),
      visible: conn.bind("state").as((s: string) => s !== "connecting"),
      onActivate: ({ active }) => {
        conn.setConnection(active)
      },
    }),
  ],
})

export const WifiToggle = () => ArrowToggleButton({
  name: "wifi",
  icon: wifi.bind("icon_name"),
  label: wifi.bind("ssid").as(ssid => ssid || "Not Connected"),
  connection: [wifi, () => wifi.enabled],
  deactivate: () => wifi.enabled = false,
  activate: () => {
    wifi.enabled = true
    wifi.scan()
  },
})

export const WifiSelection = () => Menu({
  name: "wifi",
  icon: wifi.bind("icon_name"),
  title: "Wifi Selection",
  content: [
    Widget.Box({
      vertical: true,
      setup: self => self.hook(wifi, () => self.children =
        wifi.access_points
          .sort((a, b) => b.strength - a.strength)
          .slice(0, 10)
          .map(ap => Widget.Button({
            on_clicked: () => {
              if (dependencies("nmcli"))
                Utils.execAsync(`nmcli device wifi connect ${ap.bssid}`)
            },
            child: Widget.Box({
              children: [
                Widget.Icon(ap.iconName),
                Widget.Label(ap.ssid || ""),
                Widget.Icon({
                  icon: icons.ui.tick,
                  hexpand: true,
                  hpack: "end",
                  setup: self => Utils.idle(() => {
                    if (!self.is_destroyed)
                      self.visible = ap.active
                  }),
                }),
              ],
            }),
          })),
      ),
    }),
    Widget.Separator(),
    Widget.Box({
      class_name: "vpn-connection",
      hexpand: true,
      vertical: true,
      children: vpn.bind("connections").as((ds: VpnConnection[]) => ds
        .filter(d => d.id)
        .map(VpnItem)),
    }),
    Widget.Button({
      on_clicked: () => sh(options.quicksettings.networkSettings.value),
      child: Widget.Box({
        children: [
          Widget.Icon(icons.ui.settings),
          Widget.Label("Network"),
        ],
      }),
    }),
  ],
})
