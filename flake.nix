{
  description = "A awsome AGS based shell for Hyprland";

  outputs = inputs @ {
    self,
    nixpkgs,
    ...
  }: {
    imports = [ ./nix/flake-modules/devshell.nix ];

    packages.x86_64-linux.default =
      nixpkgs.legacyPackages.x86_64-linux.callPackage ./nix/package.nix {inherit inputs;};
    homeManagerModules.default = import ./nix/hm-module.nix self;
  };

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";

    home-manager = {
      url = "github:nix-community/home-manager";
      inputs.nixpkgs.follows = "nixpkgs";
    };

    flake-parts = {
      url = "github:hercules-ci/flake-parts";
      inputs.nixpkgs-lib.follows = "nixpkgs";
    };

    # Development

    devshell = {
      url = "github:numtide/devshell";
      inputs.nixpkgs.follows = "nixpkgs";
    };

    ags.url = "github:Aylur/ags";
    astal.url = "github:Aylur/astal";
  };
}
