#!/usr/bin/env bash
set -euo pipefail

runtime_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
tmpdir="$(mktemp -d)"
trap 'rm -rf "$tmpdir"' EXIT

fake_bin="$tmpdir/bin"
docker_args="$tmpdir/docker-args.txt"
docker_tag="$tmpdir/docker-tag.txt"
docker_context="$tmpdir/docker-context.txt"
docker_t3_dir_state="$tmpdir/docker-t3-dir-state.txt"
mkdir -p "$fake_bin"

cat > "$fake_bin/docker" <<EOF
#!/usr/bin/env bash
context="\${!#}"
printf '%s\n' "\$3" > "$docker_tag"
printf '%s\n' "\$context" > "$docker_context"
if [ -d "\$context/t3code-dist" ]; then
  echo present > "$docker_t3_dir_state"
else
  echo missing > "$docker_t3_dir_state"
fi
printf '%s\n' "\$@" > "$docker_args"
exit 0
EOF
chmod +x "$fake_bin/docker"

PATH="$fake_bin:/usr/bin:/bin" \
bash "$runtime_dir/build.sh"

grep -qx 'build' "$docker_args"
grep -qx 'ghcr.io/fullagent/fullstack-web-runtime:latest' "$docker_tag"
grep -qx "$runtime_dir" "$docker_context"
grep -qx 'missing' "$docker_t3_dir_state"
