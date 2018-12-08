import React, { Component } from "react";
import "./App.css";
import { ethers, utils } from "ethers";

window.utils = utils;
window.ethers = ethers;

class Client extends Component {
  componentDidMount = async () => {
      window.c = this;
    this.props.socket.on("message_data", this.handleIncomingMessage);
  };

  handleIncomingMessage = async msg => {
    if (msg.sender == this.props.accounts[0]) {
      return false;
    }
    console.log("MESSAGE RECEIVED:", msg);
    switch (msg.data.type) {
      case "dataPacket":
        // this.receiveOffChainTxn(msg.data);
        break;
      case "fullMerkelTree":  
        break;

    }
  };

  enter = async  () =>{

  }



  render() {
    return <div className="App">client app</div>;
  }
}

export default Client;
