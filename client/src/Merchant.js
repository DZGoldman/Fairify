import React, { Component } from "react";
import "./App.css";
import { ethers, utils } from "ethers";

window.utils = utils;
window.ethers = ethers;

class Merchant extends Component {

  state = {
    dataPackets: [],
    latestPayment: {},
    nonce: 0
  }
  componentDidMount = async () => {
    window.m = this
    this.props.socket.on("message_data", this.handleIncomingMessage);
    this.setEvents()
  };


  setEvents = async () => {
    this.props.guessContract.on("*", data => {
        console.log("*** On Chain Event Event ***", data.event, "****");
        switch (data.event) {
          case "EnterStream":
            this.initiateStream(data.args.client)
            break;
  
        }
      });
  }

  initiateStream = async (client) => {
    this.props.setParentState({client})
    this.sendDataPacket()
  }

  sendDataPacket = async () =>{
    const appState = {
      nonce: this.state.nonce +1,
      dataPacket: "some data" //TODO 
    };
    const stateDigest = await this.props.guessContract.stateToDigest(appState)
    const signature = this.props.signingKey.signDigest(stateDigest);
    this.props.sendMessage({
      to:this.props.client, 
      from: this.props.merchant,
      appState,
      signature,
      type: 'dataPacket'
    })
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
