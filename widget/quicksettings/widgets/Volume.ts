import { type Stream } from "types/service/audio"
import { Arrow, Menu } from "../ToggleButton"
import { dependencies, sh } from "lib/utils"
import icons from "lib/icons.js"
const audio = await Service.import("audio")
const { ignore } = options.bar.volume

type Type = "microphone" | "speaker"

const VolumeIndicator = (type: Type = "speaker") => Widget.Button({
  vpack: "center",
  on_clicked: () => audio[type].is_muted = !audio[type].is_muted,
  child: Widget.Icon({
    icon: icons.audio.type[type],
    tooltipText: audio[type].bind("volume")
      .as(vol => `Volume: ${Math.floor(vol * 100)}%`),
  }),
})

const VolumeSlider = (type: Type = "speaker") => Widget.Slider({
  hexpand: true,
  draw_value: false,
  on_change: ({ value, dragging }) => {
    if (dragging) {
      audio[type].volume = value
      audio[type].is_muted = false
    }
  },
  value: audio[type].bind("volume"),
  class_name: audio[type].bind("is_muted").as(m => m ? "muted" : ""),
})

export const Volume = () => Widget.Box({
  class_name: "volume",
  children: [
    VolumeIndicator("speaker"),
    VolumeSlider("speaker"),
    Widget.Box({
      vpack: "center",
      child: Arrow("sink-selector"),
    }),
    Widget.Box({
      vpack: "center",
      child: Arrow("app-mixer"),
      visible: audio.bind("apps").as((a: Stream[]) => a.length > 0),
    }),
  ],
})

export const Microphone = () => Widget.Box({
  class_name: "slider horizontal",
  visible: audio.bind("recorders").as((a: Stream[]) => a
    .filter(({ stream }) => !ignore.value.includes(stream.description))
    .length > 0),
  children: [
    VolumeIndicator("microphone"),
    VolumeSlider("microphone"),
    Widget.Box({
      vpack: "center",
      child: Arrow("source-selector"),
    }),
  ],
})

const MixerItem = (stream: Stream) => Widget.Box(
  {
    hexpand: true,
    class_name: "mixer-item horizontal",
  },
  Widget.Icon({
    tooltip_text: stream.bind("name").as((n: string) => n || ""),
    icon: stream.bind("name").as((n: string) => {
      return Utils.lookUpIcon(n || "")
        ? (n || "")
        : icons.fallback.audio
    }),
  }),
  Widget.Box(
    { vertical: true },
    Widget.Label({
      xalign: 0,
      truncate: "end",
      max_width_chars: 28,
      label: stream.bind("description").as((d: string | null) => d || ""),
    }),
    Widget.Slider({
      hexpand: true,
      draw_value: false,
      value: stream.bind("volume"),
      on_change: ({ value }) => stream.volume = value,
    }),
  ),
)

const SinkItem = (stream: Stream) => Widget.Button({
  hexpand: true,
  on_clicked: () => audio.speaker = stream,
  child: Widget.Box({
    children: [
      Widget.Icon({
        icon: Utils.lookUpIcon(stream.icon_name) ? stream.icon_name : icons.fallback.audio,
        tooltip_text: stream.icon_name || "",
      }),
      Widget.Label((stream.description || "").split(" ").slice(0, 4).join(" ")),
      Widget.Icon({
        icon: icons.ui.tick,
        hexpand: true,
        hpack: "end",
        visible: audio.speaker.bind("stream").as((s: Stream) => s === stream.stream),
      }),
    ],
  }),
})

const SourceItem = (stream: Stream) => Widget.Button({
  hexpand: true,
  on_clicked: () => audio.microphone = stream,
  child: Widget.Box({
    children: [
      Widget.Icon({
        icon: Utils.lookUpIcon(stream.icon_name) ? stream.icon_name : icons.fallback.audio,
        tooltip_text: stream.icon_name || "",
      }),
      Widget.Label((stream.description || "").split(" ").slice(0, 4).join(" ")),
      Widget.Icon({
        icon: icons.ui.tick,
        hexpand: true,
        hpack: "end",
        visible: audio.microphone.bind("stream").as((s: Stream) => s === stream.stream),
      }),
    ],
  }),
})

const SettingsButton = () => Widget.Button({
  on_clicked: () => {
    if (dependencies("pavucontrol"))
      sh("pavucontrol")
  },
  hexpand: true,
  child: Widget.Box({
    children: [
      Widget.Icon(icons.ui.settings),
      Widget.Label("Settings"),
    ],
  }),
})

export const AppMixer = () => Menu({
  name: "app-mixer",
  icon: icons.audio.mixer,
  title: "App Mixer",
  content: [
    Widget.Box({
      vertical: true,
      class_name: "vertical mixer-item-box",
      children: audio.bind("apps").as((a: Stream[]) => a
        .filter(({ stream }) => !stream.is_virtual)
        .map(MixerItem)),
    }),
    Widget.Separator(),
    SettingsButton(),
  ],
})

export const SinkSelector = () => Menu({
  name: "sink-selector",
  icon: icons.audio.type.headset,
  title: "Sink Selector",
  content: [
    Widget.Box({
      vertical: true,
      children: audio.bind("speakers").as((a: Stream[]) => a
        .filter(({ stream }) => !ignore.value.includes(stream.description))
        .map(SinkItem)),
    }),
    Widget.Separator(),
    SettingsButton(),
  ],
})

export const SourceSelector = () => Menu({
  name: "source-selector",
  icon: icons.audio.type.mic,
  title: "Source Selector",
  content: [
    Widget.Box({
      vertical: true,
      children: audio.bind("microphones").as((a: Stream[]) => a
        .filter(({ stream }) => !ignore.value.includes(stream.description))
        .map(SourceItem)),
    }),
    Widget.Separator(),
    SettingsButton(),
  ],
})
