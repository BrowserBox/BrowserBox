use AppleScript version "2.4" 
use scripting additions

tell application "Safari" to activate
set deCookie to {"nytimes.com", "wired.com", "statesmanjournal.com"}

tell application "System Events"
    tell process "Safari"
        click menu item 4 of menu 1 of menu bar item 2 of menu bar 1
        delay 1
        tell window 1
            click button "Privacy" of toolbar 1
            delay 3
            click button 1 of group 1 of group 1
            
            repeat with d in deCookie
                set value of text field 1 of sheet 1 to d
                delay 2
                if row 1 of table 1 of scroll area 1 of sheet 1 exists then
                    select row 1 of table 1 of scroll area 1 of sheet 1
                    click button "Remove All" of sheet 1
                    click button "Remove Now"
                end if
             end repeat

        end tell

        click button "Done" of sheet 1 of window 1
        delay 2
        tell window 1
            click button 1
        end tell
    end tell
end tell
