#!/usr/bin/env bash

source /home/pro/.nvm/nvm.sh

N_Cores=$(grep -c ^processor /proc/cpuinfo)
Share_Cores=$(node -e "console.log(Math.min(4,$N_Cores))")
Check_Repeating_Time=7
Max_CPU_Usage=$(echo "$Share_Cores*90" | bc)
Max_RAM_Usage='66.0'
Log_Path='/var/log/auto_killer_log'
me=$(whoami)

echo '' > ./auto_killer_data

while true; do
  ps -aux | awk -v Max_CPU_Usage="$Max_CPU_Usage" -v Max_RAM_Usage="$Max_RAM_Usage" -v me="$me" -v Log_Path="$Log_Path" '{
    if ($3 >= Max_CPU_Usage || $4 >= Max_RAM_Usage) {
      print $2, $11, $1, $3, $4 >> "./process_actions.sh"
    }
  }'

  while IFS= read -r line; do
    PID=$(echo $line | cut -d ' ' -f 1)
    Proc_Name=$(echo $line | cut -d ' ' -f 2)
    Username=$(echo $line | cut -d ' ' -f 3)
    CPU_Usage=$(echo $line | cut -d ' ' -f 4)
    RAM_Usage=$(echo $line | cut -d ' ' -f 5)

    Occurrence=$(grep -c "^$PID " ./auto_killer_data || echo 0)

    if [ "$Occurrence" -eq 0 ]; then
      echo "$PID $Proc_Name" >> ./auto_killer_data
      # Optionally, renice here before escalation
    elif [ "$Occurrence" -eq 1 ]; then
      renice +19 $PID
      echo "$PID $Proc_Name" >> ./auto_killer_data
    else
      kill -9 $PID
      echo "killed $(date) $Username $Proc_Name" >> "$Log_Path"
      # Script for sudo operation
      sudo -u "$me" bash -c "cd /home/$me && . .profile && . .nvm/nvm.sh && cd bbpro && npm test"
    fi
  done < "./process_actions.sh"

  echo '' > ./process_actions.sh
  sleep $Check_Repeating_Time
done

