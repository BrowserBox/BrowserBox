#!/usr/bin/env bash

# I think I can improve the log file
# And let it count up over time
# Rather than just having 0 or 1 occurrence
# Also I would like to use renice as well
# Also I would like to use cpupower as well

N_Cores=$(grep -c ^processor /proc/cpuinfo)
Share_Cores=$(node -e "console.log(Math.min(4,$N_Cores))")
Check_Repeating_Time=7; # in seconds
Max_CPU_Usage=$(echo "$Share_Cores*90" | bc); #% #600 #400
echo "Max CPU $Max_CPU_Usage"
Max_RAM_Usage='66.0'; #% #33.3
Log_Path='/var/log/auto_killer_log'; # path to file when killing logs will be writed
me=$(whoami)

echo '' > ./auto_killer_data.new
echo '' > ./auto_killer_data

while [ 1 ]; do
  ps -aux | 
  awk '{
    Username = $1;
    Proc_Name = $11;
    CPU_Usage = $3;
    RAM_Usage = $4;
    PID = $2;
    TTY = $7;

    if((CPU_Usage >= '$Max_CPU_Usage' || RAM_Usage >= '$Max_RAM_Usage' ) &&  !($1 == "USER" || $1 == "root" || $1 == "daemon" || $1 == "mysql" || $1 == "avahi" || $1 == "polkitd") && !($11 == "npm"))
    {
      Func_Num_of_Ocur = "cat ./auto_killer_data | grep "PID" | wc -l";
      Func_Num_of_Ocur |getline Str_Num_Of_Ocur;              

      if(Str_Num_Of_Ocur == "0")
      {
        system ("echo \"\" >> /dev/" TTY);
        system ("echo \"Process "Proc_Name" used to much of resources. It will be cpulimited in '$Check_Repeating_Time' seconds if it wont stop!\" >> /dev/" TTY );
        system ("echo \"\" >> /dev/" TTY);
        system ("echo "PID" >> ./auto_killer_data.new");
      }
      else if(Str_Num_Of_Ocur == "1")
      {
        system ("echo \"\" >> /dev/" TTY);
        system ("echo \"Process "Proc_Name" used to much of resources. It will be killed in '$Check_Repeating_Time' seconds if it wont stop!\" >> /dev/" TTY );
        system ("echo \"\" >> /dev/" TTY);
        system ("cpulimit -p " PID " -l 300 -b");
        system ("echo "PID" >> ./auto_killer_data.new");
      }
      else
      {
          system ("echo \"\" >> /dev/" TTY);
          system ("echo \"Process "Proc_Name" was killed because it used to much of system resources!\" >> /dev/" TTY );
          system ("echo \"\" >> /dev/" TTY);
          system ("kill -9 " PID);
          system ("sudo -i -u '$me' bash <<EOF
          cd /home/$me
          source .profile
          source .nvm/nvm.sh
          cd bbpro
          npm test
EOF
")        
          Data = "date";
          Data |getline Str_Data;
          system ("echo \"killed "Str_Data"  "Username"  "Proc_Name" "TTY"\" >> '$Log_Path'");
      }
    }
  }';

  if [ -e ./auto_killer_data.new ]; then
      cat ./auto_killer_data.new >> ./auto_killer_data
      echo '' > ./auto_killer_data.new
  fi

  #We wait fo a while and repeate process
  sleep $Check_Repeating_Time\s;
done;

