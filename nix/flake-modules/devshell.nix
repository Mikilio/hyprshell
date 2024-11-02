{ inputs, ... }:
{
  imports = [
    inputs.devshell.flakeModule
  ];

  perSystem =
    { config, pkgs, ... }:
    {
      devshells.default = {
        devshell.packages = with pkgs; [ bun ];
        commands =
          let
            bunx = cmd: {
              name = cmd;
              command = "bunx --bun astro ${cmd}";
              category = "Astro";
            };
          in
          [
            (bunx "dev")
            (bunx "build")
            (bunx "preview")
          ];
      };
    };
}
