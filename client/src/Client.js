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
        this.respondToDataPacket(msg)
        break;
      case "fullMerkelTree":  
        break;

    }
  };

  respondToDataPacket = async (msg)=> {
    // verify signature
    const data = msg.data;
    console.log('nonce', data.appState.nonce)
    const stateDigest = await this.props.guessContract.stateToDigest(data.appState);
    let recovered = utils.recoverAddress(stateDigest, data.signature);
    if (recovered != this.props.chainData.merchant) {
      return false;
    } else {
        console.log('valid signature')
    }
    // verify data

    // send payment if not last
    const totalPackets = this.props.chainData.dataPacketsCount.toNumber();
    if (data.appState.nonce < totalPackets){
        const signature = this.props.signingKey.signDigest(stateDigest);
        this.props.sendMessage({
            to:this.props.client, 
            from: this.props.merchant,
            appState: data.appState,
            signature,
            type: 'payment'
          })

    }

  }

  enter = async  () =>{
    this.props.guessContract.enter({value: this.props.chainData.price})
  }



  render() {
    return <div className="App">client app</div>;
  }
}

export default Client;
