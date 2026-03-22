#!/usr/bin/env bash
set -euo pipefail

runtime_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
tmpdir="$(mktemp -d)"
trap 'rm -rf "$tmpdir"' EXIT

fake_home="$tmpdir/home/fulling"
fake_workspace="$tmpdir/workspace"
fake_skel="$tmpdir/skel"
fake_bin="$tmpdir/bin"
fake_auth="$tmpdir/ttyd-auth.sh"
env_dump="$tmpdir/ttyd-env.txt"
ttyd_args_dump="$tmpdir/ttyd-args.txt"
code_server_env_dump="$tmpdir/code-server-env.txt"
code_server_args_dump="$tmpdir/code-server-args.txt"

mkdir -p "$fake_home" "$fake_workspace" "$fake_skel" "$fake_bin"

printf 'export PS1="test"\n' > "$fake_skel/.bashrc"
printf 'set -g mouse on\n' > "$fake_skel/.tmux.conf"

cat > "$fake_auth" <<'EOF'
#!/usr/bin/env bash
exit 0
EOF
chmod +x "$fake_auth"

cat > "$fake_bin/ttyd" <<EOF
#!/usr/bin/env bash
printf '%s\n' "\$@" > "$ttyd_args_dump"
printf 'HOME=%s\nUSER=%s\nLOGNAME=%s\nCODEX_HOME=%s\nAUTH_SCRIPT=%s\n' \
  "\$HOME" "\${USER:-}" "\${LOGNAME:-}" "\${CODEX_HOME:-}" "\${!#}" > "$env_dump"
exit 0
EOF
chmod +x "$fake_bin/ttyd"

cat > "$fake_bin/code-server" <<EOF
#!/usr/bin/env bash
printf '%s\n' "\$@" > "$code_server_args_dump"
printf 'HOME=%s\nUSER=%s\nLOGNAME=%s\nCODEX_HOME=%s\nPASSWORD=%s\n' \
  "\$HOME" "\${USER:-}" "\${LOGNAME:-}" "\${CODEX_HOME:-}" "\${PASSWORD:-}" > "$code_server_env_dump"
exit 0
EOF
chmod +x "$fake_bin/code-server"

FULLING_HOME="$fake_home" \
FULLING_WORKSPACE="$fake_workspace" \
SKEL_DIR="$fake_skel" \
TTYD_AUTH_SCRIPT="$fake_auth" \
PATH="$fake_bin:$PATH" \
HOME=/root \
USER=root \
LOGNAME=root \
TTYD_ACCESS_TOKEN=test-token \
EDITOR_PASSWORD=editor-secret \
CODEX_BASE_URL=https://proxy.example/v1 \
CODEX_API_KEY=test-key \
bash "$runtime_dir/entrypoint.sh"

test -f "$fake_home/.codex/config.toml"
test -f "$fake_home/.codex/auth.json"
test -f "$fake_home/.config/code-server/config.yaml"

grep -q 'model_provider = "litellm"' "$fake_home/.codex/config.toml"
grep -q 'OPENAI_API_KEY' "$fake_home/.codex/auth.json"
grep -q '^bind-addr: 0.0.0.0:3773$' "$fake_home/.config/code-server/config.yaml"
grep -q '^auth: password$' "$fake_home/.config/code-server/config.yaml"
grep -q '^password: editor-secret$' "$fake_home/.config/code-server/config.yaml"
grep -q '^cert: false$' "$fake_home/.config/code-server/config.yaml"

grep -q "^HOME=$fake_home$" "$env_dump"
grep -q "^CODEX_HOME=$fake_home/.codex$" "$env_dump"
grep -q "^AUTH_SCRIPT=$fake_auth$" "$env_dump"
grep -qx -- '-T' "$ttyd_args_dump"
grep -qx -- 'xterm-256color' "$ttyd_args_dump"
grep -qx -- '-W' "$ttyd_args_dump"
grep -qx -- '-a' "$ttyd_args_dump"
! grep -qx -- '-c' "$ttyd_args_dump"

grep -q "^HOME=$fake_home$" "$code_server_env_dump"
grep -q "^CODEX_HOME=$fake_home/.codex$" "$code_server_env_dump"
grep -q '^PASSWORD=editor-secret$' "$code_server_env_dump"
grep -qx -- "$fake_workspace" "$code_server_args_dump"
