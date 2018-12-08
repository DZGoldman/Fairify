import React, { Component } from "react";
import "./App.css";
import { ethers, utils } from "ethers";

window.utils = utils;
window.ethers = ethers;

class Client extends Component {
  componentDidMount = async () => {
      window.c = this;
    this.props.socket.on("message_data", this.handleIncomingMessage);
    this.setEvents()
  };

  setEvents = async () => {
    this.props.guessContract.on("*", data => {
        console.log("*** On Chain Event Event ***", data.event, "****");
        switch (data.event) {
          case "EnterStream":
            this.props.setParentState({client:data.args.client})
            break;
  
        }
      });
  }

  handleIncomingMessage = async msg => {
    if (msg.from == this.props.accounts[0]) {
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
    this.props.guessContract.enter({value: this.props.chainData.price})
  }



  render() {
    return <div className="App">client app</div>;
  }
}

export default Client;
