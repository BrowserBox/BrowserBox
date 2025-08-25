#!/usr/bin/env bash

extend_lvm_filesystems_dynamic() {
  # Sum free space across all VGs, in whole GB (floor)
  local vg_free_space_gb
  vg_free_space_gb="$(
    vgs --noheadings --units g --nosuffix -o vg_free 2>/dev/null \
    | awk '
        { g=$1 }
        g ~ /^-$/ { next }                   # skip unknown
        g ~ /^[0-9.]+$/ { sum += g }        # numeric
        END { if (sum=="") sum=0; printf "%d", int(sum) }'
  )"

  # If parsing failed, treat as 0
  if [[ -z "${vg_free_space_gb}" || ! "${vg_free_space_gb}" =~ ^[0-9]+$ ]]; then
    vg_free_space_gb=0
  fi

  # Cap free space at 30GB
  local max_space_gb=30
  if (( vg_free_space_gb > max_space_gb )); then
    vg_free_space_gb=$max_space_gb
  fi

  # Nothing to do?
  if (( vg_free_space_gb <= 0 )); then
    echo "No free space in VG (or could not detect). Skipping LVM extension."
    return 0
  fi

  # 2/3 to /home, 1/3 to /usr (floor each)
  local home_space_gb=$(( vg_free_space_gb * 2 / 3 ))
  local usr_space_gb=$(( vg_free_space_gb / 3 ))

  # Resolve backing devices and fs types (quote vars to be safe)
  local home_fs usr_fs home_fs_type usr_fs_type
  home_fs="$(df --output=source /home | tail -1)"
  usr_fs="$(df --output=source /usr  | tail -1)"

  # Some systems have bind/overlay/etc.; lsblk may still resolve types
  home_fs_type="$(lsblk -no FSTYPE -- "$(readlink -f "$home_fs")" 2>/dev/null || true)"
  usr_fs_type="$(lsblk -no FSTYPE -- "$(readlink -f "$usr_fs")"  2>/dev/null || true)"

  # Helper: extend & grow
  extend_and_resize() {
    local dev="$1" mnt="$2" fstype="$3" add_gb="$4"

    if (( add_gb <= 0 )); then
      echo "Skipping $mnt; allocation computed as 0GB."
      return 0
    fi

    if [[ "$dev" == /dev/mapper/* || "$dev" == /dev/*/* ]] && sudo lvs --noheadings "$dev" &>/dev/null; then
      echo "Extending $dev by ${add_gb}G for $mnt..."
      sudo lvextend -L +"${add_gb}"G --resizefs "$dev" || {
        # Fallback: extend then resize ourselves
        sudo lvextend -L +"${add_gb}"G "$dev"
        if [[ "$fstype" == "xfs" ]]; then
          echo "Growing XFS on $mnt..."
          sudo xfs_growfs "$mnt"
        else
          echo "Growing $fstype on $dev..."
          sudo resize2fs "$dev"
        fi
      }
    else
      echo "Skipping $mnt ($dev) — not an LVM LV."
    fi
  }

  # Do /home
  extend_and_resize "$home_fs" "/home" "$home_fs_type" "$home_space_gb"

  # Do /usr — but only if it’s a separate mount; many systems have /usr on /
  if [[ "$(df --output=target /usr | tail -1)" == "/" ]]; then
    echo "Skipping /usr; it’s on the root filesystem."
  else
    extend_and_resize "$usr_fs" "/usr" "$usr_fs_type" "$usr_space_gb"
  fi

  echo "Filesystem extension process complete."
}

# Guard: need LVM tools to be present
if ! command -v vgs &>/dev/null || ! command -v lvextend &>/dev/null; then
  echo "No tools to extend filesystems, likely not needed."
  exit 0
fi

extend_lvm_filesystems_dynamic

