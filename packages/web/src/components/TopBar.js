import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { signIn } from '../actions';
import { SHOW_BLANK, SHOW_SIGN_IN, SHOW_COMMANDS, MD_WIDTH } from '../types/const';
import { toPx, throttle } from '../utils';

import { getTopBarSizes } from '.';

import TopBarCommands from './TopBarCommands';
import TopBarBulkEditCommands from './TopBarBulkEditCommands';
import ListName from './ListName';
import StatusPopup from './StatusPopup';

import shortLogo from '../images/logo-short.svg';

class TopBar extends React.PureComponent {

  constructor(props) {
    super(props);

    const { listNameDistanceY } = getTopBarSizes(window.innerWidth);

    this.state = {
      offsetY: Math.min(window.pageYOffset, listNameDistanceY),
    };

    this.updateScrollY = throttle(this.updateScrollY, 16);
  }

  componentDidMount() {
    if (this.props.isListNameShown) {
      window.addEventListener('scroll', this.updateScrollY);
    }
  }

  componentWillUnmount() {
    window.removeEventListener('scroll', this.updateScrollY);
  }

  updateScrollY = () => {
    const { listNameDistanceY } = getTopBarSizes(window.innerWidth);
    if (window.pageYOffset >= listNameDistanceY && this.state.offsetY >= listNameDistanceY) return;
    this.setState({ offsetY: Math.min(window.pageYOffset, listNameDistanceY) });
  }

  renderSignInBtn() {
    return (
      <button onClick={() => this.props.signIn()} className="block h-14 focus:outline-none group">
        <span className="px-2.5 py-1.5 bg-white text-sm text-gray-500 border border-gray-400 rounded-full group-hover:text-gray-600 group-hover:border-gray-500 group-focus:ring">Sign in</span>
      </button>
    );
  }

  renderListName() {

    const { offsetY } = this.state;
    const {
      listNameDistanceX,
      listNameStartY, listNameEndY, listNameDistanceY,
    } = getTopBarSizes(window.innerWidth);

    let top = listNameStartY + (offsetY * (listNameEndY - listNameStartY) / listNameDistanceY) + 3;
    const left = offsetY * listNameDistanceX / listNameDistanceY;

    const listNameStyle = { top, left };
    return (
      <div style={listNameStyle} className="absolute">
        <ListName />
      </div >
    );
  }

  renderStatusPopup() {

    const { offsetY } = this.state;
    const {
      statusPopupDistanceY,
    } = getTopBarSizes(window.innerWidth);

    const initialTop = window.innerWidth < MD_WIDTH ? '4.75rem' : '5.25rem';
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
      rightPane = isBulkEditing ? <TopBarBulkEditCommands /> : <TopBarCommands />;
    } else throw new Error(`Invalid rightPane: ${rightPaneProp}`);

    const { isListNameShown } = this.props;

    let topBarStyle, topBarStyleClasses;
    if (isListNameShown) {

      const { offsetY } = this.state;
      const {
        topBarHeight, headerHeight,
        listNameDistanceY,
      } = getTopBarSizes(window.innerWidth);

      const height = topBarHeight + (offsetY * (headerHeight - topBarHeight) / listNameDistanceY);

      topBarStyle = { height };
      topBarStyleClasses = 'fixed inset-x-0 top-0 bg-white z-30';
      if (height === headerHeight) {
        topBarStyleClasses += ' border-b border-gray-200';
      }
    } else {
      const { headerHeight } = getTopBarSizes(window.innerWidth);
      topBarStyle = { height: headerHeight };
      topBarStyleClasses = '';
    }

    return (
      <div style={topBarStyle} className={`mx-auto px-4 max-w-6xl md:px-6 lg:px-8 ${topBarStyleClasses}`}>
        <div className="relative">
          <header className="flex justify-between items-center h-14">
            <div className="relative">
              <img className="h-8" src={shortLogo} alt="Brace logo" />
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

TopBar.propTypes = {
  rightPane: PropTypes.string.isRequired,
  isListNameShown: PropTypes.bool,
};

TopBar.defaultProps = {
  isListNameShown: false,
};

const mapStateToProps = (state, props) => {
  return {
    isBulkEditing: state.display.isBulkEditing,
  };
};

const mapDispatchToProps = { signIn };

export default connect(mapStateToProps, mapDispatchToProps)(TopBar);
