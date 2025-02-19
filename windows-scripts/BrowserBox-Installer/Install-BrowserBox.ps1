# add arguments for -acceptTermsEmail <email@address> -hostname <bb host> that will also be passed through ($args)
# extend GUI to account for these which will not show if args are provided implying consent
# add wait for hostname to resolve function and console reminder to add A record
# if hostname resolves to a link local address ensure that it points at our machine. How? don't know. But can be done.
function Install-BrowserBox {
  . $PSScriptRoot\Install-BrowserBox-Task.ps1
}

