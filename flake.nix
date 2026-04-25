{
  description = "Hack-Nation : Generative City-Wallet (React Native)";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";
  };

  outputs = { self, nixpkgs }:
    let
      system = "x86_64-linux";
      pkgs = import nixpkgs {
        inherit system;
        config = {
          allowUnfree = true;
          android_sdk.accept_license = true;
        };
      };
    in
    {
      devShells.${system}.default = pkgs.mkShell {
        buildInputs = with pkgs; [
          # --- Core React Native ---
          nodejs_20
          yarn
          watchman
          
          # --- Android Development ---
          jdk17
          android-tools
          # Note: Sur NixOS, il est souvent plus simple d'utiliser 
          # Android Studio installé via le système pour l'émulateur.
          
          # --- Hackathon Speed Tools ---
          uv              # Pour tes scripts IA/Python rapides
          jq              # Manipulation JSON (Réponses API)
          gh              # GitHub CLI
          
          # --- API & Debug ---
          bruno           # Alternative Postman
          cloudflared     # Pour tes webhooks n8n
        ];

        shellHook = ''
          echo "📱 Environnement React Native prêt pour City-Wallet !"
          
          # Configuration des chemins Android pour NixOS
          export JAVA_HOME=${pkgs.jdk17.home}
          export ANDROID_HOME=$HOME/Android/Sdk
          export PATH=$PATH:$ANDROID_HOME/emulator
          export PATH=$PATH:$ANDROID_HOME/platform-tools
          
          # Initialisation Python ultra-rapide si besoin d'IA locale
          if [ ! -d ".venv" ]; then
            uv venv
          fi
          source .venv/bin/activate

          echo "🚀 Tape 'yarn start' pour lancer le packager Metro."
        '';
      };
    };
}
