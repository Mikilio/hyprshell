let
  email = "demstof@gmail.com";
  name = "Aylur";
in {
  programs.git = {
    enable = true;
    extraConfig = {
      color.ui = true;
      core.editor = "nvim";
      credential.helper = "store";
      github.user = name;
    };
    userEmail = email;
    userName = name;
  };
}