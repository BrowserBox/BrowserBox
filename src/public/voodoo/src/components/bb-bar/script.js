class BBBar extends Base {
  FlipTab(event) {
    const myIndex = [...event.target.parentElement.children].findIndex(li => li === event.target)
    const {tabs} = this.state;
    const selectedTab = tabs[myIndex];
    this.state.activateTab(event, selectedTab, {forceFrame:true});
  }
  
  FlipOnEnter(press) {
    press.key === 'Enter' && this.FlipTab(press);
  }
}
