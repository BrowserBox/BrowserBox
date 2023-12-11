extend_lvm_filesystems_dynamic() {
  # Function to extend LVM filesystems for /home and /usr based on available space and file system type

  # Determine total free space in volume group in GB
  local vg_free_space_gb=$(vgs --noheadings --nosuffix --units g -o vg_free | awk '{print int($1)}')

  # Cap the free space at 30GB
  local max_space_gb=30
  if [ "$vg_free_space_gb" -gt "$max_space_gb" ]; then
    vg_free_space_gb=$max_space_gb
  fi

  # Calculate space allocation (2/3 to /home and 1/3 to /usr)
  local home_space_gb=$((vg_free_space_gb * 2 / 3))
  local usr_space_gb=$((vg_free_space_gb / 3))

  # Check and Get File System Paths and Types
  local home_fs=$(df --output=source /home | tail -1)
  local usr_fs=$(df --output=source /usr | tail -1)
  local home_fs_type=$(lsblk -no FSTYPE $home_fs)
  local usr_fs_type=$(lsblk -no FSTYPE $usr_fs)

  # Extend and Resize /home if it's on an LVM volume
  if [[ $home_fs == /dev/mapper/* ]]; then
    echo "Extending $home_fs by $home_space_gb GB..."
    sudo lvextend -L +${home_space_gb}G $home_fs

    echo "Resizing file system on $home_fs..."
    if [[ $home_fs_type == "xfs" ]]; then
      sudo xfs_growfs /home
    else
      sudo resize2fs $home_fs
    fi
  else
    echo "Skipping /home as it's not on an LVM volume."
  fi

  # Extend and Resize /usr if it's on an LVM volume
  if [[ $usr_fs == /dev/mapper/* ]]; then
    echo "Extending $usr_fs by $usr_space_gb GB..."
    sudo lvextend -L +${usr_space_gb}G $usr_fs

    echo "Resizing file system on $usr_fs..."
    if [[ $usr_fs_type == "xfs" ]]; then
      sudo xfs_growfs /usr
    else
      sudo resize2fs $usr_fs
    fi
  else
    echo "Skipping /usr as it's not on an LVM volume."
  fi

  echo "Filesystem extension process complete."
}

# Call the function
if ! command -v vgs &>/dev/null || ! command -v lvextend &>/dev/null; then
  echo "No tools to extend filesystems, likely not needed."
  exit 0
fi

extend_lvm_filesystems_dynamic

