import React, { Component, PropTypes } from 'react'

export default class Login extends Component {
  
  render() {
    const { errorMessage } = this.props
    
    return (
      <div>
        <button onClick={(event) => this.handleClick(event)} className="btn btn-primary">
          Login
        </button>
        
        {errorMessage &&
          <p style={{color:'red'}}>{errorMessage}</p>
        }
      </div>
    )
  }
  
  handleClick(event) {
    this.props.onLoginClick()
  }
}

Login.propTypes = {
  onLoginClick: PropTypes.func.isRequired,
  errorMessage: PropTypes.string
}