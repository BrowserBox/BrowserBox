import {DEBUG, CHAR} from '../common.js';
import {s as R, c as X} from '../../node_modules/bang.html/src/vv/vanillaview.js';
  
const CLOSE = CHAR.menucloser;
const OPEN = CHAR.menuopener;
let sidebarMenuOpen = false;

export function SidebarMenuButton(state) {
  sidebarMenuOpen = state.sidebarMenuActive;
  const buttonVal = R.skip(state.sidebarMenuActive ? CLOSE : OPEN);
  const titleVal = state.sidebarMenuActive ? 'Close menu' : 'Open menu';
  return R`
    <nav class="controls sidebar-menu-button aux" stylist="styleNavControl styleSidebarMenuButton">
      <form submit=${[
        e => e.preventDefault(),
        () => {
          sidebarMenuOpen ^= true;
          state.sidebarMenuActive = sidebarMenuOpen;
          setState('bbpro', state);
        }
      ]}>
        <button title="${titleVal}" 
          accesskey=x>
          ${buttonVal}
          ${DEBUG.showUnreadBadge ? UnreadBadge(state) : ''}
        </button>
      </form>
    </nav>
  `;
}

export function UnreadBadge(state) {
  // we do like this:
  // use R (not X), and put the unread count here
  // rather than in button
  // to be able to use UnreadBadge(state) call from elsewhere to update
  // only the badge
  // sure we could call the whole tree, but it's more efficient to call the component
  // but only in terms of not getting function call overhead for its containing components
  // an alternate would be to switch on the existence of unread notifications in the 
  // button above and not have a separate component
  // but I just think it's tidier to have a separate component and call it separately
  // also we will use .badge:empty {display: none} to hide a 0 count
  // this is a bit weird, but then again, it's not :P ;) xxxx xchakka ;p ;) xxx
  DEBUG.val && console.log('badge called', state.unreadChatCount);
  return R`
    <span class=badge stylist="styleChatUnreadBadge">${
      state.unreadChatCount ? state.unreadChatCount : ''
    }</span>
  `;
}

// Helper functions 


