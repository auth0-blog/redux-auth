import React, { Component, PropTypes } from 'react'

export default class Logout extends Component {
  
  render() {
    const { onLogoutClick } = this.props
    
    return (
      <button onClick={() => onLogoutClick()} className="btn btn-primary">
        Logout
      </button>
    )
  }
  
}

Logout.propTypes = {
  onLogoutClick: PropTypes.func.isRequired
}