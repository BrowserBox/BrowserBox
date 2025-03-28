function Stop-BrowserBox {
  pm2 delete all
  taskkill /f /im node.exe
}
