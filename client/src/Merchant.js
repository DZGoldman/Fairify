import React, { Component } from "react";
import "./App.css";
import { ethers, utils } from "ethers";

window.utils = utils;
window.ethers = ethers;

class Merchant extends Component {
  componentDidMount = async () => {
    this.props.socket.on("message_data", this.handleIncomingMessage);
  };


  setEvents = async () => {
    this.props.guessContract.on("*", data => {
        console.log("*** On Chain Event Event ***", data.event, "****");
        switch (data.event) {
          case "EnterStream":
            //
            break;
  
        }
      });
  }
  handleIncomingMessage = async msg => {
    if (msg.sender == this.props.accounts[0]) {
      return false;
    }
    console.log("MESSAGE RECEIVED:", msg);
    switch (msg.data.type) {
      case "payment":
        break;

    }
  };

  render() {
    return <div className="App">merchant app</div>;
  }
}

export default Merchant;
