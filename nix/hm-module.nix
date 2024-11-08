self:
{
  config,
  pkgs,
  lib,
  ...
}:
let
  inherit (pkgs.stdenv.hostPlatform) system;
  inherit (lib.options) mkOption mkEnableOption;
  cfg = config.programs.hyprshell;
  jsonFormat = pkgs.formats.json { };

  defaultPackage = self.packages.${system}.default;
in
{
  options.programs.hyprshell = {
    enable = mkEnableOption "hyprshell";
    package = mkOption {
      default = defaultPackage;
      description = ''
        Kaizen package to use.

        By default, this option will use the `packages.default` as exposed by this flake
      '';
    };
    systemd = mkEnableOption ''
      Starts Kaizen as a systemd service.

      This will reload the configuration on profile activation.
    '';
    settings = mkOption {
      inherit (jsonFormat) type;
      default = { };
      example = lib.literalExpression ''
        {
          bar.battery.percentage = false;
          theme.dark.bg = "#131318";
          theme.dark.fg = "#e5e1e9";
          theme.dark.primary.bg =  "#c3c0ff";
          theme.dark.primary.fg = "#2b2a60";
          theme.dark.error.bg = "#ffb4ab";
          theme.dark.error.fg = "#690005";
          theme.dark.widget = "#e5e1e9";
          theme.dark.border = "#928f9a";
          autotheme = true; 
        };
      '';
      # TODO: make documentation
      description = ''
        Configuration written to {file}`$XDG_DATA_HOME/ags/config.json`.
        See
        # TODO: make documentation
        for the documentation.
      '';
    };
  };

  config = lib.mkIf cfg.enable {

    home.packages = [ cfg.package ];

    xdg.dataFile = lib.mkIf (cfg.settings != { }) {
      "ags/config.json".source = jsonFormat.generate "config.json" cfg.settings;
    };

    systemd.user.services.hyprshell =
      let
        cmd = "${cfg.package}/bin/hyprshell -b hyprshell";
        systemdTarget = "graphical-session.target";
      in
      lib.mkIf cfg.systemd {
        Unit = {
          Description = "A linux desktop environment configuration using Aylur's Gtk Shell.";
          Documentation = "https://github.com/Mikilio/hyprshell";
          PartOf = [ systemdTarget ];
          After = [ systemdTarget ];
        };

        Service = {
          ExecStart = cmd;
          ExecReload = "${cmd}; ${cmd} quit";
          ExecStop = "${cmd} quit";
          Restart = "on-failure";
          KillMode = "mixed";
        };

        Install = {
          WantedBy = [ systemdTarget ];
        };
      };
  };
}
