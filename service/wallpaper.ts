import options from "options"
import { dependencies, sh } from "lib/utils"

export type Resolution = 1920 | 1366 | 3840
export type Market =
  | "random"
  | "en-US"
  | "ja-JP"
  | "en-AU"
  | "en-GB"
  | "de-DE"
  | "en-NZ"
  | "en-CA"

const WP = `${Utils.HOME}/.config/background`
const Cache = `${Utils.HOME}/Pictures/Wallpapers/Bing`

class Wallpaper extends Service {
  static {
    Service.register(this, {}, {
      "wallpaper": ["string"],
    })
  }

  #blockMonitor = false

  #wallpaper() {
    if (!dependencies("swww"))
      return

    sh("hyprctl cursorpos").then(pos => {
      sh([
        "swww", "img",
        "--invert-y",
        "--transition-type", "grow",
        "--transition-pos", pos.replace(" ", ""),
        WP,
      ]).then(() => {
        this.changed("wallpaper")
      })
    })
  }

  async #setWallpaper(path: string) {
    this.#blockMonitor = true

    await sh(`cp ${path} ${WP}`)
    this.#wallpaper()

    this.#blockMonitor = false
  }

  async #fetchBing() {
    const res = await Utils.fetch("https://wallhaven.cc/api/v1/search", {
      params: {
        categories: "110",
        sorting: "toplist",
        ratios: "16x9",
        page: 1,
      },
    }).then(res => res.text())

    if (!res.startsWith("{"))
      return console.warn("bing api", res)

    const { data } = JSON.parse(res)
    const rnd = Math.floor(Math.random() * data.length)
    const url = data[rnd].url
    const path = data[rnd].path
    const file = `${Cache}/${url.replace("https://wallhaven.cc/w/", "")}`

    if (dependencies("curl")) {
      Utils.ensureDirectory(Cache)
      await sh(`curl "${path}" --output ${file}`)
      this.#setWallpaper(file)
    }
  }

  readonly random = () => { this.#fetchBing() }
  readonly set = (path: string) => { this.#setWallpaper(path) }
  get wallpaper() { return WP }

  constructor() {
    super()

    if (!dependencies("swww"))
      return this

    // gtk portal
    Utils.monitorFile(WP, () => {
      if (!this.#blockMonitor)
        this.#wallpaper()
    })

    Utils.execAsync("swww-daemon")
      .then(this.#wallpaper)
      .catch(() => null)
  }
}

export default new Wallpaper
