import React from 'react';
import { connect } from 'react-redux';

import {
  updatePopup, moveLinks, updateCardItemMenuPopupPosition,
} from '../actions';
import {
  CONFIRM_DELETE_POPUP,
  MY_LIST, TRASH,
  ADDING, MOVING,
  OPEN, COPY_LINK, ARCHIVE, REMOVE, RESTORE, DELETE, MOVE_TO,
  CARD_ITEM_POPUP_MENU,
} from '../types/const';
import { getListNames, getPopupLink } from '../selectors';
import { copyTextToClipboard, ensureContainUrlProtocol, throttle } from '../utils';

class CardItemMenuPopup extends React.PureComponent {

  constructor(props) {
    super(props);

    this.initialScrollY = 0;
    this.state = { scrollY: this.initialScrollY };

    this.menuPopup = React.createRef();
    this.menuBtn = React.createRef();

    this.menu = null;
    this.moveTo = null;

    this.updateScrollY = throttle(this.updateScrollY, 16);
  }

  componentDidMount() {
    if (this.props.popupLink) {
      window.addEventListener('scroll', this.updateScrollY);

      this.props.updateCardItemMenuPopupPosition(
        this.menuPopup.current.getBoundingClientRect()
      );

      this.menuBtn.current.focus();
    }
  }

  componentDidUpdate(prevProps) {
    if (!prevProps.popupLink && this.props.popupLink) {
      window.addEventListener('scroll', this.updateScrollY);

      this.props.updateCardItemMenuPopupPosition(
        this.menuPopup.current.getBoundingClientRect()
      );

      this.menuBtn.current.focus();
    }

    if (prevProps.popupLink && !this.props.popupLink) {
      window.removeEventListener('scroll', this.updateScrollY);
      this.props.updateCardItemMenuPopupPosition(null);
    }
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    if (!this.props.popupLink && nextProps.popupLink) {

      this.initialScrollY = window.pageYOffset;
      this.setState({ scrollY: this.initialScrollY });

      const { menu, moveTo } = this.populateMenu(nextProps);
      this.menu = menu;
      this.moveTo = moveTo;
    }
  }

  componentWillUnmount() {
    window.removeEventListener('scroll', this.updateScrollY);

    this.props.updateCardItemMenuPopupPosition(null);
  }

  populateMenu(props) {
    let menu = null;
    if (props.listName in CARD_ITEM_POPUP_MENU) {
      menu = CARD_ITEM_POPUP_MENU[props.listName];
    } else {
      menu = CARD_ITEM_POPUP_MENU[MY_LIST];
    }
    if ([ADDING, MOVING].includes(props.popupLink.status)) {
      menu = menu.slice(0, 2);
    }

    const moveTo = [];
    if (menu.includes(MOVE_TO)) {
      for (const listName of props.listNames) {
        if ([TRASH, ARCHIVE].includes(listName)) continue;
        if (props.listName === listName) continue;

        moveTo.push(listName);
      }
    }

    menu = menu.filter(text => text !== MOVE_TO);

    return { menu, moveTo };
  }

  updateScrollY = () => {
    this.setState({ scrollY: window.pageYOffset });
  }

  onMenuPopupClick = (e) => {

    const text = e.target.getAttribute('data-key');
    if (!text) return;

    const { id, url } = this.props.popupLink;

    if (text === OPEN) {
      window.open(ensureContainUrlProtocol(url));
    } else if (text === COPY_LINK) {
      copyTextToClipboard(url);
    } else if (text === ARCHIVE) {
      this.props.moveLinks(ARCHIVE, [id]);
    } else if (text === REMOVE) {
      this.props.moveLinks(TRASH, [id]);
    } else if (text === RESTORE) {
      this.props.moveLinks(MY_LIST, [id]);
    } else if (text === DELETE) {
      this.props.updatePopup(CONFIRM_DELETE_POPUP, true);
      return;
    } else if (text.startsWith(MOVE_TO)) {
      this.props.moveLinks(text.substring(MOVE_TO.length + 1), [id]);
    } else {
      throw new Error(`Invalid text: ${text}`);
    }

    this.props.updatePopup(id, false);
  };

  onCancelBtnClick = () => {
    this.props.updatePopup(this.props.popupLink.id, false);
  };

  renderMenu() {

    let moveTo = null;
    if (this.moveTo && this.moveTo.length) {
      moveTo = (
        <React.Fragment>
          <div className="py-2 pl-4 pr-4 block w-full text-gray-800 text-left">Move to...</div>
          {this.moveTo.map(text => {
            const key = MOVE_TO + ' ' + text;
            return <button className="py-2 pl-8 pr-4 block w-full text-gray-800 text-left hover:bg-gray-400 focus:outline-none focus:shadow-outline" key={key} data-key={key}>{text}</button>;
          })}
        </React.Fragment>
      );
    }

    return (
      <React.Fragment>
        {this.menu.map(text => <button className="py-2 pl-4 pr-4 block w-full text-gray-800 text-left hover:bg-gray-400 focus:outline-none focus:shadow-outline" key={text} data-key={text}>{text}</button>)}
        {moveTo && moveTo}
      </React.Fragment>
    );
  }

  render() {

    const { popupLink } = this.props;
    if (!popupLink) return null;

    const anchorPosition = popupLink.popupAnchorPosition;

    const offsetScrollY = this.initialScrollY - this.state.scrollY;
    const windowWidth = window.innerWidth;

    const menuBtnHeight = 48;
    const widthThreshold = 160;

    const menuBtnPosition = {
      top: `${anchorPosition.top + offsetScrollY}px`, left: `${anchorPosition.left}px`
    };

    const popupPosition = {
      top: `${anchorPosition.top + offsetScrollY + menuBtnHeight}px`,
    };

    if (anchorPosition.left + widthThreshold < windowWidth) {
      popupPosition.left = `${anchorPosition.left}px`;
    } else {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      popupPosition.right = `${windowWidth - scrollbarWidth - anchorPosition.right}px`;
    }

    return (
      <div className="relative">
        <button onClick={this.onCancelBtnClick} tabIndex={-1} className="fixed inset-0 w-full h-full bg-black opacity-25 cursor-default z-40 focus:outline-none"></button>
        <button ref={this.menuBtn} style={menuBtnPosition} className="pt-2 pb-1 pl-4 pr-2 fixed focus:outline-none-outer z-41">
          <svg className="py-2 w-6 w-6 bg-white text-gray-700 rounded-full focus:shadow-outline-inner" viewBox="0 0 24 24" stroke="currentColor" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 5v.01V5zm0 7v.01V12zm0 7v.01V19zm0-13a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div ref={this.menuPopup} onClick={this.onMenuPopupClick} style={popupPosition} className="mt-2 ml-4 mr-2 py-2 fixed min-w-32 bg-white border border-gray-200 rounded-lg shadow-xl z-41">
          {this.renderMenu()}
        </div>
      </div >
    );
  }
}

const mapStateToProps = (state, props) => {
  return {
    listName: state.display.listName,
    listNames: getListNames(state),
    popupLink: getPopupLink(state),
  }
};

const mapDispatchToProps = {
  updatePopup, moveLinks, updateCardItemMenuPopupPosition,
};

export default connect(mapStateToProps, mapDispatchToProps)(CardItemMenuPopup);
