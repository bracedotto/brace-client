import React from 'react';
import { connect } from 'react-redux';

import {
  updatePopup,
  moveLinks,
} from '../actions';
import {
  MY_LIST,
  OPEN, COPY_LINK, ARCHIVE, REMOVE, RESTORE, DELETE, MOVE_TO,
  CARD_ITEM_POPUP_MENU,
  TRASH,
} from '../types/const';
import { copyTextToClipboard } from '../utils';

const MOVE_TO_LABEL = 'MOVE_TO_LABEL';

class CardItemMenuPopup extends React.Component {

  constructor(props) {
    super(props);

    this.initialScrollY = window.scrollY;
    this.state = { scrollY: this.initialScrollY };

    const { menu, moveTo } = this.populateMenu(props);
    this.menu = menu;
    this.moveTo = moveTo;
  }

  componentDidMount() {
    window.addEventListener('scroll', this.updateScrollY);
  }

  componentWillUnmount() {
    window.removeEventListener('scroll', this.updateScrollY);
  }

  populateMenu(props) {
    let menu = null;
    if (props.listName in CARD_ITEM_POPUP_MENU) {
      menu = CARD_ITEM_POPUP_MENU[props.listName];
    } else {
      menu = CARD_ITEM_POPUP_MENU[MY_LIST];
    }

    const moveTo = [];
    if (menu.includes(MOVE_TO)) {
      for (const listName of props.listNames) {
        if ([TRASH, ARCHIVE].includes(listName)) continue;
        if (props.listName === listName) continue;

        moveTo.push(listName);
      }
    }

    menu = menu.filter(text => text != MOVE_TO);

    return { menu, moveTo };
  }

  updateScrollY = () => {
    this.setState({ scrollY: window.scrollY });
  }

  onMenuPopupClick = (e) => {

    const text = e.target.getAttribute('data-key');
    if (text === MOVE_TO_LABEL) return;

    const { id, url } = this.props.link;


    if (text === OPEN) {
      window.open(url);
    } else if (text === COPY_LINK) {
      copyTextToClipboard(url);
    } else if (text === ARCHIVE) {
      this.props.moveLinks([id], ARCHIVE);
    } else if (text === REMOVE) {

    } else if (text === RESTORE) {

    } else if (text === DELETE) {

    } else if (text.startsWith(MOVE_TO)) {

    } else {
      throw new Error(`Invalid text: ${text}`);
    }

    this.props.updatePopup(this.props.link.id, false);
  };

  onCancelBtnClick = () => {
    this.props.updatePopup(this.props.link.id, false);
  };

  renderMenu() {

    let moveTo = null;
    if (this.moveTo && this.moveTo.length) {
      moveTo = (
        <React.Fragment>
          <li key={MOVE_TO_LABEL} data-key={MOVE_TO_LABEL}>{MOVE_TO}</li>
          {this.moveTo.map(text => {
            const key = MOVE_TO + ' ' + text;
            return <li key={key} data-key={key}>{text}</li>;
          })}
        </React.Fragment>
      );
    }

    return (
      <React.Fragment>
        {this.menu.map(text => <li key={text} data-key={text}>{text}</li>)}
        {moveTo && moveTo}
      </React.Fragment>
    );
  }

  render() {

    const anchorPosition = this.props.link.popupAnchorPosition;

    const offsetScrollY = this.initialScrollY - this.state.scrollY;
    const windowWidth = window.innerWidth;
    const menuBtnWidth = 48;
    const menuBtnHeight = 40;
    const popupWidth = 192;
    const popupRightMargin = 10;

    const menuBtnPosition = {
      top: `${anchorPosition.top + offsetScrollY}px`, left: `${anchorPosition.left}px`
    };

    let left = anchorPosition.left;
    if (left + popupWidth + popupRightMargin >= windowWidth) {
      left = left - popupWidth + menuBtnWidth;
    }
    const popupPosition = {
      top: `${anchorPosition.top + offsetScrollY + menuBtnHeight}px`, left: `${left}px`
    };

    return (
      <div className="relative">
        <button onClick={this.onCancelBtnClick} tabIndex="-1" className="fixed inset-0 w-full h-full bg-black opacity-50 cursor-default focus:outline-none z-10"></button>
        <button style={menuBtnPosition} className="fixed pl-4 pr-2 pt-4 pb-2 bg-white z-20">
          <svg className="w-6 text-gray-600" viewBox="0 0 24 24" stroke="currentColor" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 5v.01V5zm0 7v.01V12zm0 7v.01V19zm0-13a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <ul onClick={this.onMenuPopupClick} style={popupPosition} className="fixed mt-2 py-2 w-48 bg-white border border-gray-200 rounded-lg shadow-xl z-20 cursor-pointer">
          {this.renderMenu()}
        </ul>
      </div >
    );
  }
}

const mapDispatchToProps = {
  updatePopup, moveLinks,
};

export default connect(null, mapDispatchToProps)(CardItemMenuPopup);
