import React from 'react';
import { connect } from 'react-redux';
import GracefulImage from 'react-graceful-image';
import jdenticon from 'jdenticon';

import {
  signIn, signOut, updatePopup, addLink, updateSearchString,
  updateBulkEdit,
} from '../actions';
import {
  ADD_POPUP, PROFILE_POPUP, SETTINGS_POPUP,
  SHOW_BLANK, SHOW_SIGN_IN, SHOW_COMMANDS,
  NO_URL, ASK_CONFIRM_URL, URL_MSGS,
  TOP_HEADER_HEIGHT, TOP_LIST_NAME_HEIGHT,
  TOP_HEADER_LIST_NAME_SPACE, TOP_HEADER_LIST_NAME_SPACE_MD,
  TOP_BAR_HEIGHT, TOP_BAR_HEIGHT_MD,
  MD_WIDTH,
} from '../types/const';
import { validateUrl, isEqual, toPx, throttle } from '../utils';

import ListName from './ListName';
import StatusPopup from './StatusPopup';
import TopBarBulkEditCommands from './TopBarBulkEditCommands';

import shortLogo from '../images/logo-short.svg';
import fullLogo from '../images/logo-full.svg';

const getSizes = (width) => {

  const topBarHeight = toPx(width < MD_WIDTH ? TOP_BAR_HEIGHT : TOP_BAR_HEIGHT_MD);
  const headerHeight = toPx(TOP_HEADER_HEIGHT);

  const LIST_NAME_DISTANCE_X = toPx('3rem');
  const LIST_NAME_DISTANCE_X_MD = toPx('9rem');
  const listNameDistanceX = width < MD_WIDTH ? LIST_NAME_DISTANCE_X : LIST_NAME_DISTANCE_X_MD;

  const LIST_NAME_START_Y = toPx(TOP_HEADER_HEIGHT) + toPx(TOP_HEADER_LIST_NAME_SPACE);
  const LIST_NAME_START_Y_MD = toPx(TOP_HEADER_HEIGHT) + toPx(TOP_HEADER_LIST_NAME_SPACE_MD);
  const listNameStartY = width < MD_WIDTH ? LIST_NAME_START_Y : LIST_NAME_START_Y_MD;

  const LIST_NAME_END_Y = (toPx(TOP_HEADER_HEIGHT) / 2 - toPx(TOP_LIST_NAME_HEIGHT) / 2);
  const LIST_NAME_END_Y_MD = (toPx(TOP_HEADER_HEIGHT) / 2 - toPx(TOP_LIST_NAME_HEIGHT) / 2);
  const listNameEndY = width < MD_WIDTH ? LIST_NAME_END_Y : LIST_NAME_END_Y_MD;

  const listNameDistanceY = Math.abs(listNameEndY - listNameStartY);

  const statusPopupDistanceY = 36;

  return {
    topBarHeight,
    headerHeight,
    listNameDistanceX,
    listNameStartY,
    listNameEndY,
    listNameDistanceY,
    statusPopupDistanceY,
  };
};

class TopBar extends React.PureComponent {

  constructor(props) {
    super(props);

    const { listNameDistanceY } = getSizes(window.innerWidth);

    this.initialState = {
      url: '',
      msg: '',
      isAskingConfirm: false,
    };
    this.state = {
      ...this.initialState,
      offsetY: Math.min(window.pageYOffset, listNameDistanceY),
    };

    this.userImage = props.userImage;
    this.profileBtnStyleClasses = 'rounded-full';
    if (this.userImage === null) {
      const svgString = jdenticon.toSvg(props.username, 32);
      this.userImage = `data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`;
      this.profileBtnStyleClasses = 'rounded-lg';
    }

    this.updateScrollY = throttle(this.updateScrollY, 16);
  }

  componentDidMount() {
    if (this.props.isListNameShown) {
      window.addEventListener('scroll', this.updateScrollY);
    }
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    if (!this.props.isAddPopupShown && nextProps.isAddPopupShown) {
      if (!isEqual(this.state, this.initialState)) {
        this.setState({ ...this.initialState });
      }
    }
  }

  componentWillUnmount() {
    window.removeEventListener('scroll', this.updateScrollY);
  }

  updateScrollY = () => {
    const { listNameDistanceY } = getSizes(window.innerWidth);
    if (window.pageYOffset >= listNameDistanceY && this.state.offsetY >= listNameDistanceY) return;
    this.setState({ offsetY: Math.min(window.pageYOffset, listNameDistanceY) });
  }

  onAddBtnClick = () => {
    if (this.props.isAddPopupShown) return;
    this.props.updatePopup(ADD_POPUP, true);
  }

  onAddInputChange = (e) => {
    this.setState({ url: e.target.value, msg: '', isAskingConfirm: false });
  }

  onAddInputKeyPress = (e) => {
    if (e.key === 'Enter') this.onAddOkBtnClick();
  }

  onAddOkBtnClick = () => {
    if (!this.state.isAskingConfirm) {
      const urlValidatedResult = validateUrl(this.state.url);
      if (urlValidatedResult === NO_URL) {
        this.setState({ msg: URL_MSGS[urlValidatedResult], isAskingConfirm: false });
        return;
      }
      if (urlValidatedResult === ASK_CONFIRM_URL) {
        this.setState({ msg: URL_MSGS[urlValidatedResult], isAskingConfirm: true });
        return;
      }
    }

    this.props.addLink(this.state.url, true);
    this.props.updatePopup(ADD_POPUP, false);
  }

  onAddCancelBtnClick = () => {
    this.props.updatePopup(ADD_POPUP, false);
  }

  onSearchInputChange = (e) => {
    this.props.updateSearchString(e.target.value);
  }

  onSearchClearBtnClick = () => {
    this.props.updateSearchString('');
  }

  onBulkEditBtnClick = () => {
    this.props.updateBulkEdit(true);
  }

  onProfileBtnClick = () => {
    if (this.props.isProfilePopupShown) return;
    this.props.updatePopup(PROFILE_POPUP, true);
  }

  onProfileCancelBtnClick = () => {
    this.props.updatePopup(PROFILE_POPUP, false);
  }

  onSettingsBtnClick = () => {
    this.props.updatePopup(PROFILE_POPUP, false);
    this.props.updatePopup(SETTINGS_POPUP, true);
  }

  onSignOutBtnClick = () => {
    this.props.updatePopup(PROFILE_POPUP, false);
    this.props.signOut();
  }

  renderAddPopup() {

    const { url, msg, isAskingConfirm } = this.state;

    const style = {};
    if (window.innerWidth < 832) style['left'] = 0;
    else style['right'] = 0;

    return (
      <React.Fragment>
        <button onClick={this.onAddCancelBtnClick} tabIndex={-1} className="fixed inset-0 w-full h-full bg-black opacity-25 cursor-default z-40 focus:outline-none"></button>
        <div style={style} className="mt-2 px-4 pt-6 pb-6 absolute w-72 bg-white border border-gray-200 rounded-lg shadow-xl z-41 md:w-96">
          <div className="flex">
            <span className="inline-flex items-center bg-white text-sm font-medium text-gray-700">Url:</span>
            <div className="ml-3 flex-1">
              <input onChange={this.onAddInputChange} onKeyPress={this.onAddInputKeyPress} className="px-4 py-2 form-input w-full bg-white text-base text-gray-900 rounded-full border border-gray-500 appearance-none focus:outline-none focus:shadow-outline" type="url" placeholder="https://" value={url} autoFocus />
            </div>
          </div>
          <p className="pt-3 text-red-600">{msg}</p>
          <div className="pt-3">
            <button onClick={this.onAddOkBtnClick} className="px-5 py-2 bg-gray-800 text-base text-white font-medium rounded-full shadow-sm hover:shadow-outline active:bg-gray-600 focus:outline-none focus:shadow-outline">{isAskingConfirm ? 'Sure' : 'Save'}</button>
            <button onClick={this.onAddCancelBtnClick} className="ml-4 text-gray-700 rounded-sm hover:text-gray-900 hover:underline focus:outline-none focus:shadow-outline">Cancel</button>
          </div>
        </div>
      </React.Fragment>
    );
  }

  renderProfilePopup() {
    return (
      <React.Fragment>
        <button onClick={this.onProfileCancelBtnClick} tabIndex={-1} className="fixed inset-0 w-full h-full bg-black opacity-25 cursor-default z-40 focus:outline-none"></button>
        <div className="mt-2 py-2 absolute right-0 w-32 bg-white border border-gray-200 rounded-lg shadow-xl z-41">
          <button onClick={this.onSettingsBtnClick} className="py-2 pl-4 block w-full text-gray-800 text-left hover:bg-gray-400 focus:outline-none focus:shadow-outline">Settings</button>
          <a className="py-2 pl-4 block w-full text-gray-800 text-left hover:bg-gray-400 focus:outline-none focus:shadow-outline" href="/#support">Support</a>
          <button onClick={this.onSignOutBtnClick} className="py-2 pl-4 block w-full text-gray-800 text-left hover:bg-gray-400 focus:outline-none focus:shadow-outline">Sign out</button>
        </div>
      </React.Fragment>
    );
  }

  renderCommands() {

    const { isAddPopupShown, isProfilePopupShown } = this.props;
    const { searchString } = this.props;

    const searchClearBtnClasses = searchString.length === 0 ? 'hidden' : '';

    return (
      <div className="flex justify-end items-center">
        <div className="relative">
          <button onClick={this.onAddBtnClick} style={{ padding: '0.2rem 0.8rem 0.2rem 0.65rem' }} className={`flex items-center border border-gray-700 rounded-full shadow-sm group hover:border-gray-900 hover:shadow-outline active:bg-gray-200 focus:outline-none focus:shadow-outline ${isAddPopupShown ? 'z-41' : ''}`}>
            <svg className="w-3 text-gray-700 group-hover:text-gray-900" viewBox="0 0 16 14" stroke="currentColor" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 1V13M1 6.95139H15" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="ml-1 text-base text-gray-700 group-hover:text-gray-900">Add</span>
          </button>
          {isAddPopupShown && this.renderAddPopup()}
        </div>
        <div className="relative ml-4 w-48 lg:w-56">
          <div className="pl-3 absolute inset-y-0 left-0 flex items-center">
            <svg className="h-6 w-6 text-gray-600" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M16.32 14.9l1.1 1.1c.4-.02.83.13 1.14.44l3 3a1.5 1.5 0 0 1-2.12 2.12l-3-3a1.5 1.5 0 0 1-.44-1.14l-1.1-1.1a8 8 0 1 1 1.41-1.41l.01-.01zM10 16a6 6 0 1 0 0-12 6 6 0 0 0 0 12z" />
            </svg>
          </div>
          <input onChange={this.onSearchInputChange} className="py-1 pl-10 pr-6 form-input block w-full bg-gray-300 text-gray-900 border border-transparent rounded-full placeholder-gray-600 appearance-none hover:shadow-outline focus:outline-none focus:shadow-outline focus:bg-white focus:border-gray-300" type="search" placeholder="Search" value={searchString} />
          <button onClick={this.onSearchClearBtnClick} className={`pr-2 ${searchClearBtnClasses} absolute inset-y-0 right-0 flex items-center focus:outline-none-outer`}>
            <svg className="h-5 text-gray-600 cursor-pointer rounded-full focus:shadow-outline-inner" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" clipRule="evenodd" d="M10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18ZM8.70711 7.29289C8.31658 6.90237 7.68342 6.90237 7.29289 7.29289C6.90237 7.68342 6.90237 8.31658 7.29289 8.70711L8.58579 10L7.29289 11.2929C6.90237 11.6834 6.90237 12.3166 7.29289 12.7071C7.68342 13.0976 8.31658 13.0976 8.70711 12.7071L10 11.4142L11.2929 12.7071C11.6834 13.0976 12.3166 13.0976 12.7071 12.7071C13.0976 12.3166 13.0976 11.6834 12.7071 11.2929L11.4142 10L12.7071 8.70711C13.0976 8.31658 13.0976 7.68342 12.7071 7.29289C12.3166 6.90237 11.6834 6.90237 11.2929 7.29289L10 8.58579L8.70711 7.29289Z" />
            </svg>
          </button>
        </div>
        <div className="relative ml-4">
          <button onClick={this.onBulkEditBtnClick} className={`px-3 py-1 flex items-center border border-gray-600 rounded-full shadow-sm group hover:border-gray-900 hover:shadow-outline active:bg-gray-200 focus:outline-none focus:shadow-outline`}>

            <svg className="mx-auto w-4 text-gray-600 group-hover:text-gray-800" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.4142 2.58579C16.6332 1.80474 15.3668 1.80474 14.5858 2.58579L7 10.1716V13H9.82842L17.4142 5.41421C18.1953 4.63316 18.1953 3.36683 17.4142 2.58579Z" />
              <path fillRule="evenodd" clipRule="evenodd" d="M2 6C2 4.89543 2.89543 4 4 4H8C8.55228 4 9 4.44772 9 5C9 5.55228 8.55228 6 8 6H4V16H14V12C14 11.4477 14.4477 11 15 11C15.5523 11 16 11.4477 16 12V16C16 17.1046 15.1046 18 14 18H4C2.89543 18 2 17.1046 2 16V6Z" />
            </svg>
            <span className="ml-1 text-base text-gray-700 group-hover:text-gray-900">Select</span>
          </button>
        </div>
        <div className="relative ml-4">
          <button onClick={this.onProfileBtnClick} className={`relative block h-8 w-8 overflow-hidden border-2 border-gray-200 ${isProfilePopupShown ? 'z-41' : ''} hover:shadow-outline focus:outline-none focus:shadow-outline ${this.profileBtnStyleClasses}`}>
            <GracefulImage className="h-full w-full bg-white object-cover" src={this.userImage} alt="Profile" />
          </button>
          {isProfilePopupShown && this.renderProfilePopup()}
        </div>
      </div>
    );
  }

  renderSignInBtn() {

    return (
      <button onClick={() => this.props.signIn()} className="block h-14 focus:outline-none-outer">
        <span style={{ padding: '0.3125rem 0.6875rem' }} className="bg-white text-base text-gray-700 border border-gray-700 rounded-full shadow-sm hover:bg-gray-800 hover:text-white active:bg-gray-900 focus:shadow-outline-inner">Sign in</span>
      </button>
    );
  }

  renderListName() {

    const { offsetY } = this.state;
    const {
      listNameDistanceX,
      listNameStartY, listNameEndY, listNameDistanceY,
    } = getSizes(window.innerWidth);

    // Start from MD width, align baseline with Brace logo instead of align center
    let top = listNameStartY + (offsetY * (listNameEndY - listNameStartY) / listNameDistanceY);
    if (window.innerWidth >= MD_WIDTH) top += 6;
    const left = offsetY * listNameDistanceX / listNameDistanceY;

    const listNameStyle = { top, left };
    return (
      <div style={listNameStyle} className="absolute">
        <ListName fetched={this.props.fetched} />
      </div >
    );
  }

  renderStatusPopup() {

    const { offsetY } = this.state;
    const {
      statusPopupDistanceY,
    } = getSizes(window.innerWidth);

    const initialTop = window.innerWidth < MD_WIDTH ? '4.6rem' : '5.095rem';
    const top = Math.max(0, toPx(initialTop) - offsetY);
    const right = 0;
    const opacity = Math.max(0, 1.0 - (offsetY / statusPopupDistanceY));
    const visibility = offsetY >= statusPopupDistanceY ? 'hidden' : 'visible';

    const statusPopupStyle = { top, right, opacity, visibility };
    return (
      /** @ts-ignore */
      <div style={statusPopupStyle} className="absolute">
        <StatusPopup />
      </div>
    );
  }

  render() {

    const rightPaneProp = this.props.rightPane;
    const isBulkEditing = this.props.isBulkEditing;

    let rightPane;
    if (rightPaneProp === SHOW_BLANK) rightPane = null;
    else if (rightPaneProp === SHOW_SIGN_IN) rightPane = this.renderSignInBtn();
    else if (rightPaneProp === SHOW_COMMANDS) {
      if (isBulkEditing) rightPane = <TopBarBulkEditCommands />;
      else rightPane = this.renderCommands();
    } else throw new Error(`Invalid rightPane: ${rightPaneProp}`);

    const { isListNameShown } = this.props;

    let topBarStyle, topBarStyleClasses;
    if (isListNameShown) {

      const { offsetY } = this.state;
      const {
        topBarHeight, headerHeight,
        listNameDistanceY,
      } = getSizes(window.innerWidth);

      const height = topBarHeight + (offsetY * (headerHeight - topBarHeight) / listNameDistanceY);

      topBarStyle = { height };
      topBarStyleClasses = 'fixed inset-x-0 top-0 bg-white z-30';
      if (height === headerHeight) {
        topBarStyleClasses += ' border-b border-gray-300';
      }
    } else {
      const { headerHeight } = getSizes(window.innerWidth);
      topBarStyle = { height: headerHeight };
      topBarStyleClasses = '';
    }

    return (
      <div style={topBarStyle} className={`mx-auto px-4 max-w-6xl md:px-6 lg:px-8 ${topBarStyleClasses}`}>
        <div className="relative">
          <header className="flex justify-between items-center h-14">
            <div className="relative">
              <img className="h-8 md:hidden" src={shortLogo} alt="Brace logo" />
              <img className="hidden h-6 md:block" src={fullLogo} alt="Brace logo" />
            </div>
            {rightPane}
          </header>
          {isListNameShown && this.renderListName()}
          {isListNameShown && this.renderStatusPopup()}
        </div>
      </div>
    );
  }
}

TopBar.defaultProps = {
  isListNameShown: false,
  fetched: null,
};

const mapStateToProps = (state, props) => {
  return {
    username: state.user.username,
    userImage: state.user.image,
    searchString: state.display.searchString,
    isAddPopupShown: state.display.isAddPopupShown,
    isProfilePopupShown: state.display.isProfilePopupShown,
    isBulkEditing: state.display.isBulkEditing,
  };
};

const mapDispatchToProps = {
  signIn, signOut, updatePopup, addLink, updateSearchString, updateBulkEdit,
};

export default connect(mapStateToProps, mapDispatchToProps)(TopBar);
